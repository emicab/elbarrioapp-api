import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import authRoutes from './api/auth/auth.routes';
import userRoutes from './api/users/user.routes';
import eventRoutes from './api/events/event.routes';
import postRoutes from './api/posts/post.routes';
import adminRoutes from './api/admin/admin.routes';
import benefitRoutes from './api/benefits/benefit.routes';
import redeemRoutes from './api/redeem/redeem.routes';
import commentRoutes from './api/comment/comment.routes';
import channelRoutes from './api/channels/channel.routes';
import orderRoutes from './api/orders/order.routes';
import ticketRoutes from './api/tickets/ticket.routes';
import friendRoutes from './api/friends/friend.routes';

const app = express();

// Middlewares básicos
app.use(cors());
app.use(express.json());
app.use(morgan('dev'))

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/admin', adminRoutes)
app.use('/api/benefits', benefitRoutes)
app.use('/api/redeem', redeemRoutes)
app.use('/api/comments', commentRoutes)
app.use('/api/channels', channelRoutes)
app.use('/api/orders', orderRoutes);
app.use('/api/tickets', ticketRoutes)
app.use('/api/friends', friendRoutes);



export default app;