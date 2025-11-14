import { User } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { io } from '../../socket';
import { uploadImage } from '../users/user.service';

export const createPost = async (
    authorId: string, 
    content: string, 
    files?: Express.Multer.File[], 
    channelId?: string, 
    eventId?: string
) => {
    if (!channelId) {
        throw new Error("No se ha especificado un canal para la publicación.");
    }
    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel) throw new Error("Canal no encontrado");

    // Si el canal es privado, verificamos si el autor puede postear.
    if (channel.isPrivate) {
        const membership = await prisma.channelMembership.findUnique({
            where: { userId_channelId: { userId: authorId, channelId: channel.id } }
        });
        if (!membership || membership.status !== 'MEMBER') {
            throw new Error("No tienes permiso para publicar en este canal.");
        }
    }

    const imageUrls: string[] = [];

    // Si hay archivos, los subimos uno por uno a Cloudinary
    if (files && files.length > 0) {
        for (const file of files) {
            const imageUrl = await uploadImage(file.buffer, 'ElBarrioApp_posts');
            imageUrls.push(imageUrl);
        }
    }

    /** se crea el post para enviarlo */
    const newPost = await prisma.post.create({
        // @ts-ignore
        data: {
            authorId,
            content,
            imageUrls,
            channelId,
            ...(eventId && { eventId })
        },
        include: {
            author: {
                select: {
                    firstName: true,
                    lastName: true,
                    isVerified: true,
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

    io.emit('post:new', newPost.id)
    return newPost;
};

export const findAllPosts = async () => {
    const posts = await prisma.post.findMany({
        orderBy: {
            createdAt: 'desc'
        },
        include: { // Incluimos información del autor
            author: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    isVerified: true,
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
                            isVerified: true,
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

export const findAllPostsForUser = async (userId: string, channelSlug?: string, eventId?: string) => {

    // 1. Preparamos el filtro base
    const whereClause: any = {};

    // 2. Si llega un channelSlug y NO es "todos", lo añadimos dinámicamente al filtro
    if (channelSlug && channelSlug !== 'Todos') {
        whereClause.channel = {
            slug: {
                equals: channelSlug,
                mode: 'insensitive',
            },
        };
    }

    if (eventId) {
        whereClause.eventId = eventId;
    }

    // 3. Ejecutamos la consulta a la base de datos con el filtro construido
    const posts = await prisma.post.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: {
            event: true,
            author: { select: { firstName: true, lastName: true, isVerified: true, profile: { select: { avatarUrl: true } } } },
            _count: { select: { comments: true, likes: true } },
            likes: { where: { userId: userId } },
            comments: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                include: { author: { select: { firstName: true } } },
            },
        },
    });

    // ... (El resto de la lógica para mapear y añadir `likedByCurrentUser` se mantiene igual)
    return posts.map(post => {
        const { likes, comments, ...restOfPost } = post;
        return {
            ...restOfPost,
            likedByCurrentUser: likes.length > 0,
            lastComment: comments[0] || null,
        };
    });
};

export const addCommentToPost = async (postId: string, authorId: string, text: string) => {
    const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { authorId: true }
    })

    const newComment = await prisma.comment.create({
        data: {
            postId,
            authorId,
            text
        }
    });

    console.log('🔥 Emitiendo comment:new ->', newComment);
    console.log('Sockets conectados:', io.of('/').sockets.size);

    // Notificamos a todos que este post fue actualizado
    io.emit('comment:new', newComment);  
    io.emit('interaction:update', { postId });

    if (post.authorId !== authorId) {
        io.to(post.authorId).emit('notification:new', {
            message: 'Recibiste un comentario en tu publicación.',
            postId: postId
        })
    }

    return newComment;
};

export const findCommentsForPost = async (postId: string, userId: string) => {
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
                    isVerified: true,
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

export const toggleLikeOnPost = async (postId: string, userId: string) => {
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
    io.emit('interaction:update', { postId });
};

/**
 * Encuentra un único post por su ID y calcula los datos dinámicos para el usuario actual.
 */
export const findPostByIdForUser = async (postId: string, userId: string) => {
    const post = await prisma.post.findUnique({
        where: {
            id: postId
        },
        include: {
            author: {
                select: {
                    firstName: true,
                    lastName: true,
                    isVerified: true,
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
                            isVerified: true,
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

    if (!post) {
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

/**
 * Elimina una publicación si el usuario tiene los permisos necesarios.
 * @param postId - El ID de la publicación a eliminar.
 * @param currentUser - El objeto del usuario que realiza la petición (contiene ID y rol).
 */
export const deletePost = async (postId: string, currentUser: User) => {
    const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { authorId: true }
    })

    if(!post) {
        throw new Error('publicacion no encontrada.')
    }
    
    const isAuthor = post.authorId === currentUser.id
    const isAdmin = currentUser.role === "ADMIN"

    if (!isAuthor && !isAdmin){
        throw new Error('No tienes permiso para eliminar esta publicación.')
    }

    await prisma.post.delete({
        where: {id: postId}
    })
    io.emit('post:deleted', postId)
    io.emit('interaction:update', { postId })
}