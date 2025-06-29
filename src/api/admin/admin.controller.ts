import { Request, Response } from 'express';
import * as AdminService from './admin.service';

export const createCompanyController = async (req: Request, res: Response) => {
  try {
    const company = await AdminService.createCompany(req.body);
    res.status(201).json(company);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

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