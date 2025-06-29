import { Response } from 'express';
import { AuthRequest } from '../../middlewares/isAuthenticated';
import * as EventService from './event.service';

export const createEventController = async (req: AuthRequest, res: Response) => {
  try {
    const organizerId = req.user?.userId;
    if (!organizerId) return res.status(400).json({ message: 'ID de organizador no encontrado.' });

    const eventData = { ...req.body, organizerId };
    const event = await EventService.createEvent(eventData);
    res.status(201).json(event);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllEventsController = async (req: AuthRequest, res: Response) => {
  try {
    const { city } = req.query;
    const events = await EventService.findAllEvents(city as string | undefined);
    res.status(200).json(events);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getEventByIdController = async (req: AuthRequest, res: Response) => {
  try {
    const event = await EventService.findEventById(req.params.id);
    res.status(200).json(event);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

// ... más controladores

export const getNearbyEventsController = async (req: AuthRequest, res: Response) => {
  try {
    const { lat, lon, radius } = req.query;
    if (!lat || !lon || !radius) {
      return res.status(400).json({ message: 'Parámetros lat, lon y radius son requeridos.' });
    }
    const events = await EventService.findEventsNearby(Number(lat), Number(lon), Number(radius));
    res.status(200).json(events);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
