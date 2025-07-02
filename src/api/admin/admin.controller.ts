import { Request, Response } from 'express';
import * as AdminService from './admin.service';
import { AuthRequest } from '../../middlewares/isAuthenticated';

export const createBenefitController = async (req: Request, res: Response) => {
  try {
    // El body de la petición ya viene con el formato correcto desde el frontend
    const benefit = await AdminService.createBenefit(req.body);
    res.status(201).json(benefit);
  } catch (error: any) {
    // Manejamos el error específico de "empresa no encontrada" para dar una mejor respuesta
    if (error.message.includes("No se encontró ninguna empresa")) {
        return res.status(404).json({ message: error.message });
    }
    // Para cualquier otro error, devolvemos un 500
    res.status(500).json({ message: error.message });
  }
};

export const getBenefitsController = async (req: Request, res: Response) => {
  try {
    const benefits = await AdminService.getBenefits();
    res.status(200).json(benefits);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createChannelController = async (req: Request, res: Response) => {
  try {
    const channel = await AdminService.createChannel(req.body);
    res.status(201).json(channel);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export const createEventController = async (req: AuthRequest, res: Response) => {
  try {
    const organizerId = req.user?.userId;
    if (!organizerId) {
      return res.status(403).json({ message: 'No autenticado' });
    }

    const eventData = { ...req.body, organizerId };
    // `req.files` ahora es un array de archivos
    const files = req.files as Express.Multer.File[] | undefined;

    const event = await AdminService.createEvent(eventData, files);
    res.status(201).json(event);
  } catch (error: any) {
    console.error("Error al crear el evento:", error);
    res.status(500).json({ message: error.message });
  }
};

export const createCompanyController = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.userId; // El admin que crea la empresa es el "dueño" inicial
    if (!adminId) {
      return res.status(403).json({ message: 'No autenticado' });
    }

    const companyData = { ...req.body, adminId };
    const logoBuffer = req.file?.buffer;

    const company = await AdminService.createCompany(companyData, logoBuffer);
    res.status(201).json(company);
  } catch (error: any) {
    console.error("Error al crear la empresa:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getAllCompaniesController = async (req: AuthRequest, res: Response) => {
    try {
        const companies = await AdminService.findAllCompanies();
        res.status(200).json(companies);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};