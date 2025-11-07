import {Request, Response} from 'express';
import {AuthRequest} from '../../middlewares/isAuthenticated';
import * as BenefitService from './benefit.service';
import { prisma } from '../../lib/prisma';

export const getBenefitsController = async (req: AuthRequest, res: Response) => {
    try {
        // 1. Obtenemos el userId del token (la ruta debe estar protegida)
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(403).json({ message: 'Usuario no autenticado.' });
        }

        // 2. Obtenemos 'city' y el nuevo 'category' de la query
        const { city, category } = req.query;

        if (!city) {
            return res.status(400).json({ message: 'El parámetro city es requerido.' });
        }

        // 3. Llamamos a la nueva función del servicio pasándole todos los datos
        const benefits = await BenefitService.findBenefitsByCityForUser(
            city as string,
            userId,
            category as string | undefined // 'category' es opcional
        );

        res.status(200).json(benefits);

    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const generateQrController = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const { claimedId } = req.params;
  
      if (!userId) {
        return res.status(403).json({ message: 'Usuario no autenticado.' });
      }
  
      // 1️⃣ Buscamos el beneficio reclamado para verificar su estado
      const claimedBenefit = await prisma.claimedBenefit.findUnique({
        where: { id: claimedId },
        select: { id: true, userId: true, status: true },
      });
  
      if (!claimedBenefit) {
        return res.status(404).json({ message: 'Beneficio reclamado no encontrado.' });
      }
  
      if (claimedBenefit.userId !== userId) {
        return res.status(403).json({ message: 'No tienes acceso a este beneficio.' });
      }
  
      // 2️⃣ Validar estado antes de generar el QR
      if (claimedBenefit.status !== 'AVAILABLE') {
        return res.status(400).json({ message: `Este beneficio ya fue ${claimedBenefit.status === 'USED' ? 'usado' : 'expirado'}.` });
      }
  
      // 3️⃣ Generar token de redención solo si está disponible
      const redemption = await BenefitService.generateRedemptionToken(claimedId, userId);
  
      return res.status(201).json({
        token: redemption.token,
        expiresAt: redemption.expiresAt,
      });
  
    } catch (error: any) {
      console.error('Error al generar QR:', error);
      return res.status(500).json({ message: 'Error al generar el código QR.' });
    }
  };
  

/**
 *  
 * @returns Se obtienen todos los canjes activos para el usuario actual.
 */
export const getActiveRedemptionController = async (req : AuthRequest, res : Response) => {
    try {
        const userId = req.user ?. userId;
        const {id: benefitId} = req.params;

        if (! userId) 
            return res.status(403).json({message: 'Usuario no autenticado.'});
        

        const redemption = await BenefitService.findActiveRedemptionForUser(benefitId, userId);
        res.status(200).json(redemption); // Devuelve el canje si existe, o null si no
    } catch (error : any) {
        res.status(500).json({message: error.message});
    }
};

export const getBenefitByIdController = async (req: AuthRequest, res: Response) => {
  try {
    const { id: benefitId } = req.params;
    const userId = req.user?.userId;

    if (!userId) return res.status(403).json({ message: 'Usuario no autenticado.' });

    const benefitDetails = await BenefitService.findBenefitDetailsForUser(benefitId, userId);
    res.status(200).json(benefitDetails);

  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

// --- NUEVO CONTROLADOR ---
export const claimBenefitController = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { id: benefitId } = req.params;

        if (!userId) {
            return res.status(403).json({ message: 'Usuario no autenticado.' });
        }

        await BenefitService.claimBenefitForUser(benefitId, userId);
        res.status(200).json({ success: true, message: 'Beneficio reclamado con éxito.' });

    } catch (error: any) {
        // Devolvemos el mensaje de error específico del servicio
        res.status(400).json({ message: error.message });
    }
};

// --- NUEVO CONTROLADOR ---
export const getMyClaimedBenefitsController = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(403).json({ message: 'Usuario no autenticado.' });
        }
        
        const claimedBenefits = await BenefitService.findClaimedBenefitsForUser(userId);
        res.status(200).json(claimedBenefits);

    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// --- NUEVO CONTROLADOR ---
export const getClaimedBenefitByIdController = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { id: claimedId } = req.params;

        if (!userId) {
            return res.status(403).json({ message: 'Usuario no autenticado.' });
        }

        const claimedBenefit = await BenefitService.findClaimedBenefitById(claimedId, userId);
        res.status(200).json(claimedBenefit);

    } catch (error: any) {
        res.status(404).json({ message: error.message });
    }
};
