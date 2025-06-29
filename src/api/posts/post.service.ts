import {prisma} from '../../lib/prisma';
import {io} from '../../socket';

export const createPost = async (authorId : string, content : string, imageUrl? : string) => {
    const newPost = await prisma.post.create({
        data: {
            authorId,
            content,
            imageUrl
        },
        include: {
            author: {
                select: {
                    firstName: true,
                    lastName: true,
                    profile: {
                        select: {
                            avatarUrl: true
                        }
                    }
                }
            },
            _count: {
                select: {
                    comments: true,
                    likes: true
                }
            }
        }
    });

    io.emit('post:new', newPost)
    return newPost;
};

export const findAllPosts = async () => {
    const posts =  await prisma.post.findMany({
        orderBy: {
            createdAt: 'desc'
        },
        include: { // Incluimos información del autor
            author: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    profile: {
                        select: {
                            avatarUrl: true
                        }
                    }
                }
            },
            // ¡Prisma puede contar relaciones por nosotros! Esto es muy eficiente.
            _count: {
                select: {
                    comments: true,
                    likes: true
                }
            },
            comments: {
                orderBy: {
                    createdAt: 'desc'
                },
                take: 1,
                include: {
                    author: {
                        select: {
                            firstName: true,
                            lastName: true,
                            profile: {
                                select: {
                                    avatarUrl: true
                                }
                            }
                        }
                    }
                }
            },
			likes: {
				select: {
					userId: true
				}
			}
        }
    });

	return posts.map(post => {
        const {
            likes,
            comments,
            ...restOfPost
        } = post;
        return {
            ...restOfPost,
            likedByCurrentUser: likes.length > 0,
            // Añadimos 'lastComment' al objeto final si existe
            lastComment: comments[0] || null
        };
    });
};

export const findAllPostsForUser = async (userId : string) => {
    const posts = await prisma.post.findMany({
        orderBy: {
            createdAt: 'desc'
        },
        include: {
            author: {
                select: {
                    firstName: true,
                    lastName: true,
                    profile: {
                        select: {
                            avatarUrl: true
                        }
                    }
                }
            },
            _count: {
                select: {
                    comments: true,
                    likes: true
                }
            },
            // Incluimos los likes para saber si el usuario actual ya dio like
            likes: {
                where: {
                    userId: userId
                }
            },
            comments: {
                orderBy: {
                    createdAt: 'desc'
                },
                take: 1,
                include: {
                    author: {
                        select: {
                            firstName: true,
                            lastName: true,
                            profile: {
                                select: {
                                    avatarUrl: true
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    // Mapeamos el resultado para añadir el campo `likedByCurrentUser`
    return posts.map(post => {
        const {
            likes,
            comments,
            ...restOfPost
        } = post;
        return {
            ...restOfPost,
            likedByCurrentUser: likes.length > 0,
            // Añadimos 'lastComment' al objeto final si existe
            lastComment: comments[0] || null
        };
    });
};

export const addCommentToPost = async (postId : string, authorId : string, text : string) => {
    const post = await prisma.post.findUnique({
		where: { id: postId},
		select: { authorId: true }
	})
	
	const newComment = await prisma.comment.create({
        data: {
            postId,
            authorId,
            text
        }
    });

    // Notificamos a todos que este post fue actualizado
    io.emit('interaction:update', {postId});

	if(post.authorId !== authorId){
		io.to(post.authorId).emit('notification:new', {
			message: 'Recibiste un comentario en tu publicación.',
			postId: postId
		})
	}

    return newComment;
};

export const findCommentsForPost = async (postId : string, userId : string) => {
    const comments = await prisma.comment.findMany({
        where: {
            postId
        },
        orderBy: {
            createdAt: 'asc'
        },
        include: {
            author: {
                select: {
                    firstName: true,
                    lastName: true,
                    profile: {
                        select: {
                            avatarUrl: true
                        }
                    }
                }
            },
            _count: {
                select: {
                    likes: true
                }
            },
            likes: {
                where: {
                    userId
                }
            }
        }
    });

    return comments.map(comment => {
        const {
            likes,
            ...rest
        } = comment;
        return {
            ...rest,
            likedByCurrentUser: likes.length > 0
        };
    });
};

export const toggleLikeOnPost = async (postId : string, userId : string) => {
    const existingLike = await prisma.like.findUnique({
        where: {
            userId_postId: {
                userId,
                postId
            }
        }
    });

    if (existingLike) {
        await prisma.like.delete({
            where: {
                userId_postId: {
                    userId,
                    postId
                }
            }
        });
    } else {
        await prisma.like.create({
            data: {
                userId,
                postId
            }
        });
    }

    // Notificamos a todos que este post fue actualizado
    io.emit('interaction:update', {postId});
};

/**
 * Encuentra un único post por su ID y calcula los datos dinámicos para el usuario actual.
 */
export const findPostByIdForUser = async (postId : string, userId : string) => {
    const post = await prisma.post.findUnique({
        where: {
            id: postId
        },
        include: {
            author: {
                select: {
                    firstName: true,
                    lastName: true,
                    profile: {
                        select: {
                            avatarUrl: true
                        }
                    }
                }
            },
            _count: {
                select: {
                    comments: true,
                    likes: true
                }
            },
            likes: {
                where: {
                    userId: userId
                }
            },
            comments: {
                orderBy: {
                    createdAt: 'desc'
                },
                take: 1,
                include: {
                    author: {
                        select: {
                            firstName: true,
                            lastName: true,
                            profile: {
                                select: {
                                    avatarUrl: true
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    if (! post) {
        throw new Error('Publicación no encontrada.');
    }

    // Mapeamos el resultado para añadir los campos dinámicos
    const {
        likes,
        comments,
        ...restOfPost
    } = post;
    return {
        ...restOfPost,
        likedByCurrentUser: likes.length > 0,
        lastComment: comments[0] || null
    };
};
