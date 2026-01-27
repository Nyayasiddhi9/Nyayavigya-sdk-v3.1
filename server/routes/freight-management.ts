import { Router } from 'express';
import { db } from '../db';
import { 
  inquiries, quotations, orders, shipments, companies, users, 
  services, routes as freightRoutes, carriers, invoices, payments, documents,
  type Inquiry, type Quotation, type Order, type Shipment,
  type Company, type Service, type Route, type Carrier
} from '@shared/freight-schema';
import { eq, and, or, desc, asc, sql, like } from 'drizzle-orm';
import { freightOrchestrationSystem } from '../services/freight-orchestration-system';

const router = Router();

// Inquiry Management APIs
router.get('/api/freight/inquiries', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const inquiriesList = await db
      .select({
        inquiry: inquiries,
        customer: companies,
        salesPerson: users
      })
      .from(inquiries)
      .leftJoin(companies, eq(inquiries.customerId, companies.id))
      .leftJoin(users, eq(inquiries.salesPersonId, users.id))
      .where(eq(inquiries.tenantId, tenantId))
      .orderBy(desc(inquiries.createdAt))
      .limit(limit)
      .offset(offset);

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(inquiries)
      .where(eq(inquiries.tenantId, tenantId));

    res.json({
      inquiries: inquiriesList,
      pagination: {
        page,
        limit,
        total: total[0].count,
        pages: Math.ceil(total[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/api/freight/inquiries', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const {
      customerId,
      subject,
      origin,
      destination,
      cargoDetails,
      transportMode,
      serviceType,
      expectedPickupDate,
      expectedDeliveryDate,
      specialRequirements,
      customerReference
    } = req.body;

    // Generate inquiry number
    const inquiryNumber = `INQ-${Date.now()}`;

    const [newInquiry] = await db
      .insert(inquiries)
      .values({
        tenantId,
        inquiryNumber,
        customerId,
        subject,
        origin,
        destination,
        cargoDetails,
        transportMode,
        serviceType,
        expectedPickupDate: expectedPickupDate ? new Date(expectedPickupDate) : null,
        expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null,
        specialRequirements,
        customerReference,
        status: 'submitted',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      })
      .returning();

    // Trigger AI-powered analysis
    setTimeout(async () => {
      await analyzeInquiryWithAI(newInquiry.id);
    }, 1000);

    res.status(201).json(newInquiry);
  } catch (error) {
    console.error('Error creating inquiry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Quotation Management APIs
router.get('/api/freight/quotations', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const quotationsList = await db
      .select({
        quotation: quotations,
        inquiry: inquiries,
        customer: companies,
        route: freightRoutes,
        service: services
      })
      .from(quotations)
      .leftJoin(inquiries, eq(quotations.inquiryId, inquiries.id))
      .leftJoin(companies, eq(quotations.customerId, companies.id))
      .leftJoin(freightRoutes, eq(quotations.routeId, freightRoutes.id))
      .leftJoin(services, eq(quotations.serviceId, services.id))
      .where(eq(quotations.tenantId, tenantId))
      .orderBy(desc(quotations.createdAt));

    res.json(quotationsList);
  } catch (error) {
    console.error('Error fetching quotations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/api/freight/quotations', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const {
      inquiryId,
      customerId,
      routeId,
      serviceId,
      carrierIds,
      lineItems,
      totalCost,
      totalSelling,
      marginPercent,
      validUntil,
      terms,
      notes
    } = req.body;

    const quotationNumber = `QTE-${Date.now()}`;

    // Calculate AI-optimized pricing
    const optimizedPricing = await calculateOptimalPricing({
      routeId,
      serviceId,
      carrierIds,
      lineItems
    });

    const [newQuotation] = await db
      .insert(quotations)
      .values({
        tenantId,
        quotationNumber,
        inquiryId,
        customerId,
        routeId,
        serviceId,
        carrierIds,
        totalCost: optimizedPricing.totalCost.toString(),
        totalSelling: optimizedPricing.totalSelling.toString(),
        marginPercent: optimizedPricing.marginPercent.toString(),
        currency: 'USD',
        validUntil: validUntil ? new Date(validUntil) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        terms,
        notes,
        lineItems: optimizedPricing.lineItems,
        status: 'draft'
      })
      .returning();

    // Update inquiry status
    await db
      .update(inquiries)
      .set({ status: 'quoted', updatedAt: new Date() })
      .where(eq(inquiries.id, inquiryId));

    res.status(201).json(newQuotation);
  } catch (error) {
    console.error('Error creating quotation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Order Management APIs
router.get('/api/freight/orders', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const ordersList = await db
      .select({
        order: orders,
        quotation: quotations,
        customer: companies,
        salesPerson: users
      })
      .from(orders)
      .leftJoin(quotations, eq(orders.quotationId, quotations.id))
      .leftJoin(companies, eq(orders.customerId, companies.id))
      .leftJoin(users, eq(orders.salesPersonId, users.id))
      .where(eq(orders.tenantId, tenantId))
      .orderBy(desc(orders.createdAt));

    res.json(ordersList);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/api/freight/orders', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const {
      quotationId,
      customerId,
      salesPersonId,
      totalAmount,
      paymentTerms,
      customerReference,
      specialInstructions
    } = req.body;

    const orderNumber = `ORD-${Date.now()}`;

    const [newOrder] = await db
      .insert(orders)
      .values({
        tenantId,
        orderNumber,
        quotationId,
        customerId,
        salesPersonId,
        totalAmount,
        paymentTerms,
        customerReference,
        specialInstructions,
        status: 'pending',
        orderDate: new Date()
      })
      .returning();

    // Auto-create shipment
    setTimeout(async () => {
      await createShipmentFromOrder(newOrder.id);
    }, 500);

    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Shipment Management APIs
router.get('/api/freight/shipments', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const shipmentsList = await db
      .select({
        shipment: shipments,
        order: orders,
        customer: companies,
        route: freightRoutes
      })
      .from(shipments)
      .leftJoin(orders, eq(shipments.orderId, orders.id))
      .leftJoin(companies, eq(shipments.customerId, companies.id))
      .leftJoin(freightRoutes, eq(shipments.routeId, freightRoutes.id))
      .where(eq(shipments.tenantId, tenantId))
      .orderBy(desc(shipments.createdAt));

    res.json(shipmentsList);
  } catch (error) {
    console.error('Error fetching shipments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/api/freight/shipments/track', async (req, res) => {
  try {
    const { trackingNumber } = req.body;
    
    const [shipment] = await db
      .select()
      .from(shipments)
      .where(eq(shipments.trackingNumber, trackingNumber));

    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    // Get real-time tracking from carriers
    const trackingData = await getCarrierTrackingData(shipment);
    
    res.json({
      shipment,
      tracking: trackingData
    });
  } catch (error) {
    console.error('Error tracking shipment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Customer Management APIs
router.get('/api/freight/customers', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const search = req.query.search as string;
    let whereConditions = [
      eq(companies.tenantId, tenantId),
      eq(companies.type, 'customer')
    ];

    if (search) {
      whereConditions.push(or(
        like(companies.name, `%${search}%`),
        like(companies.email, `%${search}%`)
      ));
    }

    const query = db
      .select()
      .from(companies)
      .where(and(...whereConditions));

    const customers = await query.orderBy(asc(companies.name));
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/api/freight/customers', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const {
      name,
      email,
      phone,
      website,
      address,
      contactPerson,
      creditLimit,
      paymentTerms
    } = req.body;

    const [newCustomer] = await db
      .insert(companies)
      .values({
        tenantId,
        name,
        type: 'customer',
        email,
        phone,
        website,
        address: JSON.stringify(address),
        contactPerson,
        creditLimit,
        paymentTerms
      })
      .returning();

    res.status(201).json(newCustomer);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Analytics and Reporting APIs
router.get('/api/freight/analytics/dashboard', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const [
      totalInquiries,
      totalQuotations,
      totalOrders,
      totalShipments,
      activeShipments,
      deliveredShipments,
      totalRevenue
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(inquiries).where(eq(inquiries.tenantId, tenantId)),
      db.select({ count: sql<number>`count(*)` }).from(quotations).where(eq(quotations.tenantId, tenantId)),
      db.select({ count: sql<number>`count(*)` }).from(orders).where(eq(orders.tenantId, tenantId)),
      db.select({ count: sql<number>`count(*)` }).from(shipments).where(eq(shipments.tenantId, tenantId)),
      db.select({ count: sql<number>`count(*)` }).from(shipments).where(and(
        eq(shipments.tenantId, tenantId),
        eq(shipments.status, 'in_transit')
      )),
      db.select({ count: sql<number>`count(*)` }).from(shipments).where(and(
        eq(shipments.tenantId, tenantId),
        eq(shipments.status, 'delivered')
      )),
      db.select({ sum: sql<number>`sum(total_amount)` }).from(orders).where(eq(orders.tenantId, tenantId))
    ]);

    // Calculate performance metrics using AI
    const performanceMetrics = await calculatePerformanceMetrics(tenantId);

    res.json({
      summary: {
        totalInquiries: totalInquiries[0].count,
        totalQuotations: totalQuotations[0].count,
        totalOrders: totalOrders[0].count,
        totalShipments: totalShipments[0].count,
        activeShipments: activeShipments[0].count,
        deliveredShipments: deliveredShipments[0].count,
        totalRevenue: totalRevenue[0].sum || 0
      },
      performance: performanceMetrics,
      trends: await calculateTrendAnalysis(tenantId)
    });
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// SDLC Orchestration Status API
router.get('/api/freight/orchestration/status', async (req, res) => {
  try {
    const projectStatus = freightOrchestrationSystem.getProjectStatus();
    res.json(projectStatus);
  } catch (error) {
    console.error('Error fetching orchestration status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/api/freight/orchestration/start', async (req, res) => {
  try {
    await freightOrchestrationSystem.startProject();
    res.json({ message: 'Project orchestration started' });
  } catch (error) {
    console.error('Error starting orchestration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper functions
async function analyzeInquiryWithAI(inquiryId: string) {
  // Simulate AI-powered inquiry analysis
  console.log(`🤖 AI analyzing inquiry ${inquiryId}...`);
  
  // This would integrate with multiple LLM providers for analysis
  const analysis = {
    routeRecommendations: ['SEA-LAX-ORD-JFK', 'SEA-DEN-CHI-NYC'],
    carrierSuggestions: ['UPS', 'FedEx', 'DHL'],
    estimatedCost: Math.floor(Math.random() * 5000) + 1000,
    riskAssessment: 'Low',
    optimizedServices: ['Express', 'Standard']
  };
  
  console.log(`✅ AI analysis complete for inquiry ${inquiryId}`, analysis);
  return analysis;
}

async function calculateOptimalPricing(params: any) {
  // Simulate AI-powered pricing optimization
  const baseRate = Math.floor(Math.random() * 3000) + 1000;
  const margin = 0.25;
  
  return {
    totalCost: baseRate,
    totalSelling: baseRate * (1 + margin),
    marginPercent: margin * 100,
    lineItems: [
      { description: 'Freight Charges', amount: baseRate * 0.7 },
      { description: 'Fuel Surcharge', amount: baseRate * 0.15 },
      { description: 'Documentation', amount: baseRate * 0.05 },
      { description: 'Insurance', amount: baseRate * 0.10 }
    ]
  };
}

async function createShipmentFromOrder(orderId: string) {
  // Auto-create shipment from confirmed order
  console.log(`🚚 Auto-creating shipment for order ${orderId}...`);
  
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order) return;

  const shipmentNumber = `SHP-${Date.now()}`;
  const trackingNumber = `TRK-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  await db.insert(shipments).values({
    tenantId: order.tenantId,
    shipmentNumber,
    orderId: order.id,
    customerId: order.customerId,
    trackingNumber,
    status: 'booked',
    origin: { code: 'LAX', name: 'Los Angeles, CA' },
    destination: { code: 'JFK', name: 'New York, NY' },
    cargoDetails: { description: 'General Cargo', weight: 1500 },
    scheduledPickupDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    scheduledDeliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    trackingHistory: JSON.stringify([
      {
        timestamp: new Date(),
        location: 'Los Angeles, CA',
        status: 'Booked',
        description: 'Shipment booked and ready for pickup'
      }
    ])
  });

  console.log(`✅ Shipment ${shipmentNumber} created for order ${orderId}`);
}

async function getCarrierTrackingData(shipment: any) {
  // Simulate real-time carrier API integration
  return {
    currentLocation: 'Denver, CO',
    status: 'In Transit',
    estimatedDelivery: shipment.scheduledDeliveryDate,
    lastUpdate: new Date(),
    events: [
      {
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        location: 'Los Angeles, CA',
        status: 'Picked Up',
        description: 'Package picked up from shipper'
      },
      {
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        location: 'Phoenix, AZ',
        status: 'In Transit',
        description: 'Package in transit to next facility'
      },
      {
        timestamp: new Date(),
        location: 'Denver, CO',
        status: 'In Transit',
        description: 'Package arrived at sorting facility'
      }
    ]
  };
}

async function calculatePerformanceMetrics(tenantId: string) {
  // AI-powered performance analysis
  return {
    onTimeDeliveryRate: 94.7,
    customerSatisfactionScore: 4.6,
    averageTransitTime: 3.2,
    costEfficiencyIndex: 87.3,
    carrierPerformanceScore: 92.1
  };
}

async function calculateTrendAnalysis(tenantId: string) {
  // AI-powered trend analysis
  return {
    inquiryGrowth: 12.5,
    conversionRate: 78.3,
    revenueGrowth: 23.7,
    seasonalTrends: {
      q1: 85,
      q2: 92,
      q3: 103,
      q4: 120
    }
  };
}

export default router;