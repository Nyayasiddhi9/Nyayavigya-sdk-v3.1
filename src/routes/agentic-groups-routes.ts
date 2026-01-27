/**
 * Agentic Groups API Routes
 * 
 * Provides API access to Sector Groups and Company of Agents management
 */

import { Router, Request, Response } from 'express';
import { agenticGroupsService, SectorType } from '../services/agentic-groups-service';

const router = Router();

router.get('/sectors', (req: Request, res: Response) => {
  try {
    const sectors = agenticGroupsService.getAllSectorGroups();
    res.json({
      success: true,
      count: sectors.length,
      sectors: sectors.map(s => ({
        id: s.id,
        name: s.name,
        sector: s.sector,
        description: s.description,
        icon: s.icon,
        color: s.color,
        headAgent: s.headAgent.name,
        totalAgents: 1 + s.specialistAgents.length + s.supportAgents.length,
        capabilities: s.capabilities,
        status: s.status
      }))
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/sectors/:sectorId', (req: Request, res: Response) => {
  try {
    const sector = agenticGroupsService.getSectorGroup(req.params.sectorId);
    if (!sector) {
      return res.status(404).json({ success: false, error: 'Sector group not found' });
    }
    res.json({ success: true, sector });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/sectors/by-type/:sectorType', (req: Request, res: Response) => {
  try {
    const sector = agenticGroupsService.getSectorGroupBySector(req.params.sectorType as SectorType);
    if (!sector) {
      return res.status(404).json({ success: false, error: 'Sector type not found' });
    }
    res.json({ success: true, sector });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/sectors/stats/summary', (req: Request, res: Response) => {
  try {
    const stats = agenticGroupsService.getSectorStats();
    res.json({ success: true, stats });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/companies', (req: Request, res: Response) => {
  try {
    const { ownerId } = req.query;
    let companies = agenticGroupsService.getAllCompanies();
    
    if (ownerId && typeof ownerId === 'string') {
      companies = agenticGroupsService.getCompaniesByOwner(ownerId);
    }

    res.json({
      success: true,
      count: companies.length,
      companies: companies.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
        ownerId: c.ownerId,
        sectorCount: c.sectorGroups.length,
        standaloneAgentCount: c.standaloneAgents.length,
        customAgentCount: c.customAgents.length,
        coordinationMode: c.coordinationMode,
        status: c.status,
        createdAt: c.createdAt
      }))
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/companies/:companyId', (req: Request, res: Response) => {
  try {
    const company = agenticGroupsService.getCompany(req.params.companyId);
    if (!company) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }

    const sectorDetails = company.sectorGroups.map(sId => {
      const sector = agenticGroupsService.getSectorGroup(sId);
      return sector ? {
        id: sector.id,
        name: sector.name,
        sector: sector.sector,
        icon: sector.icon,
        color: sector.color,
        totalAgents: 1 + sector.specialistAgents.length + sector.supportAgents.length
      } : null;
    }).filter(Boolean);

    res.json({
      success: true,
      company,
      sectorDetails,
      stats: agenticGroupsService.getCompanyStats(req.params.companyId)
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/companies', (req: Request, res: Response) => {
  try {
    const { name, description, ownerId, sectorGroups, standaloneAgents, coordinationMode } = req.body;

    if (!name || !ownerId) {
      return res.status(400).json({ success: false, error: 'Name and ownerId are required' });
    }

    const company = agenticGroupsService.createCompanyOfAgents({
      name,
      description: description || '',
      ownerId,
      sectorGroups: sectorGroups || [],
      standaloneAgents: standaloneAgents || [],
      coordinationMode: coordinationMode || 'hybrid'
    });

    res.status(201).json({
      success: true,
      company,
      stats: agenticGroupsService.getCompanyStats(company.id)
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/companies/:companyId/sectors', (req: Request, res: Response) => {
  try {
    const { sectorGroupId } = req.body;
    if (!sectorGroupId) {
      return res.status(400).json({ success: false, error: 'sectorGroupId is required' });
    }

    const success = agenticGroupsService.addSectorGroupToCompany(req.params.companyId, sectorGroupId);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Company not found or sector already added' });
    }

    const company = agenticGroupsService.getCompany(req.params.companyId);
    res.json({
      success: true,
      company,
      stats: agenticGroupsService.getCompanyStats(req.params.companyId)
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/companies/:companyId/sectors/:sectorGroupId', (req: Request, res: Response) => {
  try {
    const success = agenticGroupsService.removeSectorGroupFromCompany(
      req.params.companyId,
      req.params.sectorGroupId
    );
    if (!success) {
      return res.status(404).json({ success: false, error: 'Company not found or sector not in company' });
    }

    const company = agenticGroupsService.getCompany(req.params.companyId);
    res.json({
      success: true,
      company,
      stats: agenticGroupsService.getCompanyStats(req.params.companyId)
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/companies/:companyId/agents', (req: Request, res: Response) => {
  try {
    const { agentId } = req.body;
    if (!agentId) {
      return res.status(400).json({ success: false, error: 'agentId is required' });
    }

    const success = agenticGroupsService.addStandaloneAgentToCompany(req.params.companyId, agentId);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Company not found or agent already added' });
    }

    const company = agenticGroupsService.getCompany(req.params.companyId);
    res.json({
      success: true,
      company,
      stats: agenticGroupsService.getCompanyStats(req.params.companyId)
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/companies/:companyId/custom-agents', (req: Request, res: Response) => {
  try {
    const { id, name, description, baseAgentId, tier, romaLevel, capabilities, tools, systemPromptOverrides } = req.body;

    if (!id || !name || !tier || !romaLevel) {
      return res.status(400).json({ success: false, error: 'id, name, tier, and romaLevel are required' });
    }

    const success = agenticGroupsService.addCustomAgentToCompany(req.params.companyId, {
      id,
      name,
      description: description || '',
      baseAgentId,
      tier,
      romaLevel,
      capabilities: capabilities || [],
      tools: tools || [],
      systemPromptOverrides,
      status: 'draft'
    });

    if (!success) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }

    const company = agenticGroupsService.getCompany(req.params.companyId);
    res.json({
      success: true,
      company,
      stats: agenticGroupsService.getCompanyStats(req.params.companyId)
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/companies/:companyId/activate', (req: Request, res: Response) => {
  try {
    const success = agenticGroupsService.activateCompany(req.params.companyId);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }

    const company = agenticGroupsService.getCompany(req.params.companyId);
    res.json({
      success: true,
      company,
      stats: agenticGroupsService.getCompanyStats(req.params.companyId)
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/companies/:companyId/stats', (req: Request, res: Response) => {
  try {
    const stats = agenticGroupsService.getCompanyStats(req.params.companyId);
    if (!stats) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }
    res.json({ success: true, stats });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
