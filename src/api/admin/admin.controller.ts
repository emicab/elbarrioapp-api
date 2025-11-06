import { Request, Response } from 'express';
import * as AdminService from './admin.service';
import { AuthRequest } from '../../middlewares/isAuthenticated';

export const createBenefitController = async (req: Request, res: Response) => {
  try {
    // --- Validación y Conversión Mejorada ---
    const usageLimitRaw = req.body.usageLimit;
    const pointCostRaw = req.body.pointCost; // Puede ser undefined o ""

    // Validamos usageLimit (asumimos que es obligatorio)
    const usageLimit = parseInt(usageLimitRaw, 10);
    if (isNaN(usageLimit) || usageLimit <= 0) {
      return res.status(400).json({ message: 'El límite de uso debe ser un número positivo.' });
    }

    // Validamos pointCost (si existe, debe ser un número no negativo)
    let pointCost: number | undefined = undefined; // Por defecto es undefined
    if (pointCostRaw !== undefined && pointCostRaw !== null && pointCostRaw !== '') {
        pointCost = parseInt(pointCostRaw, 10);
        if (isNaN(pointCost) || pointCost < 0) {
            return res.status(400).json({ message: 'El costo en puntos debe ser un número no negativo.' });
        }
    }
    // --- Fin Validación ---

    const benefitData = {
      ...req.body, // Copiamos el resto de los datos
      usageLimit: usageLimit, // Usamos el valor ya parseado y validado
      pointCost: pointCost,   // Usamos el valor parseado o undefined
    };

    const benefit = await AdminService.createBenefit(benefitData);
    res.status(201).json(benefit);
  } catch (error: any) {
    if (error.message.includes("No se encontró ninguna empresa")) {
      return res.status(404).json({ message: error.message });
    }
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

    // Verificamos si 'tickets' es un string y lo parseamos a un objeto/array.
    if (eventData.tickets && typeof eventData.tickets === 'string') {
      try {
        eventData.tickets = JSON.parse(eventData.tickets);
      } catch (e) {
        return res.status(400).json({ message: 'El formato de los tickets es inválido.' });
      }
    }

    // Nos aseguramos de que los campos numéricos se conviertan correctamente.
    if (Array.isArray(eventData.tickets)) {
      eventData.tickets.forEach((ticket: any) => {
        ticket.priceInCents = parseInt(String(ticket.priceInCents), 10);
        ticket.quantity = parseInt(String(ticket.quantity), 10);
      });
    }

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

    const companyData = { 
      ...req.body,
      adminId
    };
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

export const updateBenefitController = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const benefit = await AdminService.updateBenefit(id, req.body);
    res.status(200).json(benefit);
  } catch (error: any) {
    console.error("Error al actualizar beneficio:", error);
    res.status(500).json({ message: error.message });
  }
};

// --- NUEVO CONTROLADOR PARA ELIMINAR ---
export const deleteBenefitController = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await AdminService.deleteBenefit(id);
    res.status(200).json({ message: 'Beneficio eliminado correctamente.' });
  } catch (error: any) {
    console.error("Error al eliminar beneficio:", error);
    res.status(500).json({ message: error.message });
  }
};