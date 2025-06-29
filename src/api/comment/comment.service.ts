import {prisma} from '../../lib/prisma';
import {io} from '../../socket';
import { Expo } from 'expo-server-sdk';

const expo = new Expo();

export const toggleLikeOnComment = async (commentId : string, userId : string) => {
    const existingLike = await prisma.commentLike.findUnique({
        where: {
            userId_commentId: {
                userId,
                commentId
            }
        },
        
    });

    const comment = await prisma.comment.findUnique({
        where: {
            id: commentId
        },
        include: { author: { select: { id: true, pushToken: true } } }
    });
    if (! comment) 
        throw new Error("Comment not found");
    

    if (existingLike) {
        await prisma.commentLike.delete({
            where: {
                userId_commentId: {
                    userId,
                    commentId
                }
            }
        });
    } else {
        await prisma.commentLike.create({
            data: {
                userId,
                commentId
            }
        });
    }

    // Notificamos a todos que hubo una interacción en el post padre
    io.emit('interaction:update', {postId: comment.postId});

    if (comment.authorId !== userId) {
        io.to(comment.authorId).emit('notification:new', {
            message: 'A alguien le gustó tu publicación',
            commentId: commentId
        })
    }

    if(comment.author.id !== userId && comment.author.pushToken){
        if(Expo.isExpoPushToken(comment.author.pushToken)){
            const message = {
                to: comment.author.pushToken,
                sound: 'default',
                title: '¡A alguien le gustó tu comentario!',
                body: '¡Entra a la app para ver quien fue!',
                data: { postId: comment.postId }
            }
            await expo.sendPushNotificationsAsync([message]);
        }
    }


    return {success: true};
};
