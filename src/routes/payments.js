const express = require('express');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

const FLW_BASE_URL = process.env.FLW_BASE_URL || 'https://api.flutterwave.com/v3';
const PREMIUM_SUPPORT_AMOUNT_RWF = Number(process.env.PREMIUM_SUPPORT_AMOUNT_RWF || 500);
const PREMIUM_DURATION_DAYS = Number(process.env.PREMIUM_DURATION_DAYS || 30);

const isFlutterwaveConfigured = () => Boolean((process.env.FLW_SECRET_KEY || '').trim());

const toDate = (value) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date() : d;
};

const buildTxRef = (userId) => {
  const suffix = userId ? userId.slice(-6) : 'guest';
  return `umunsi_${Date.now()}_${suffix}_${crypto.randomBytes(4).toString('hex')}`;
};

const getFrontendBaseUrl = () => {
  const configured = (process.env.FRONTEND_URL || '').trim();
  if (configured) return configured.replace(/\/$/, '');
  return process.env.NODE_ENV === 'production' ? 'https://umunsi.com' : 'http://localhost:5173';
};

const flutterwaveRequest = async (endpoint, options = {}) => {
  const secretKey = process.env.FLW_SECRET_KEY;
  if (!secretKey) {
    throw new Error('Missing FLW_SECRET_KEY in environment');
  }

  const response = await fetch(`${FLW_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const reason = payload?.message || payload?.error || 'Flutterwave request failed';
    throw new Error(reason);
  }

  return payload;
};

const applyPremiumActivation = async (userId, paidAt) => {
  const now = paidAt || new Date();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { premiumUntil: true }
  });

  const base = user?.premiumUntil && new Date(user.premiumUntil) > now ? new Date(user.premiumUntil) : now;
  const nextPremiumUntil = new Date(base.getTime() + PREMIUM_DURATION_DAYS * 24 * 60 * 60 * 1000);

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      isPremium: true,
      isVerified: true,
      premiumSince: now,
      premiumUntil: nextPremiumUntil
    },
    select: {
      id: true,
      isPremium: true,
      premiumSince: true,
      premiumUntil: true
    }
  });

  return updated;
};

const verifyAndSyncByTxRef = async (payment, knownTransactionId) => {
  if (payment.status === 'SUCCESS') {
    const premium = await prisma.user.findUnique({
      where: { id: payment.userId },
      select: {
        id: true,
        isPremium: true,
        premiumSince: true,
        premiumUntil: true
      }
    });

    return {
      payment,
      premium,
      verification: null
    };
  }

  const verification = await flutterwaveRequest(`/transactions/verify_by_reference?tx_ref=${encodeURIComponent(payment.txRef)}`, {
    method: 'GET'
  });

  const transactionData = verification?.data || {};
  const providerStatus = String(transactionData?.status || '').toUpperCase();
  const paidAmount = Number(transactionData?.amount || 0);
  const currency = String(transactionData?.currency || '').toUpperCase();
  const isSuccessful = providerStatus === 'SUCCESSFUL';
  const isAmountValid = paidAmount >= Number(payment.amount || 0);
  const isCurrencyValid = currency === String(payment.currency || 'RWF').toUpperCase();

  if (isSuccessful && isAmountValid && isCurrencyValid) {
    const paidAt = transactionData?.created_at ? toDate(transactionData.created_at) : new Date();

    const updatedPayment = await prisma.supportPayment.update({
      where: { id: payment.id },
      data: {
        status: 'SUCCESS',
        providerStatus,
        flwTransactionId: String(knownTransactionId || transactionData?.id || ''),
        customerEmail: transactionData?.customer?.email || payment.customerEmail,
        paidAt,
        errorMessage: null,
        metadata: JSON.stringify({
          paymentType: transactionData?.payment_type || null,
          processorResponse: transactionData?.processor_response || null,
          appFee: transactionData?.app_fee || null,
          flwRef: transactionData?.flw_ref || null
        })
      }
    });

    const premium = await applyPremiumActivation(payment.userId, paidAt);

    return {
      payment: updatedPayment,
      premium,
      verification
    };
  }

  const failureReason = isSuccessful
    ? `Amount/currency mismatch. amount=${paidAmount}, currency=${currency}`
    : verification?.message || 'Payment was not successful';

  const updatedPayment = await prisma.supportPayment.update({
    where: { id: payment.id },
    data: {
      status: 'FAILED',
      providerStatus: providerStatus || 'FAILED',
      flwTransactionId: String(knownTransactionId || transactionData?.id || ''),
      errorMessage: failureReason
    }
  });

  return {
    payment: updatedPayment,
    premium: null,
    verification
  };
};

router.post('/flutterwave/initialize', authenticateToken, async (req, res) => {
  let paymentRecord = null;
  try {
    if (!isFlutterwaveConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'Flutterwave is not configured on this server yet.',
        message: 'Set FLW_SECRET_KEY and restart backend.'
      });
    }

    const amount = Number(req.body?.amount || PREMIUM_SUPPORT_AMOUNT_RWF);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount'
      });
    }

    const txRef = buildTxRef(req.user.id);
    const redirectUrl = `${getFrontendBaseUrl()}/subscriber/account?payment=callback`;
    const fullName = [req.user.firstName, req.user.lastName].filter(Boolean).join(' ').trim() || req.user.username;

    paymentRecord = await prisma.supportPayment.create({
      data: {
        userId: req.user.id,
        provider: 'FLUTTERWAVE',
        purpose: 'PREMIUM_SUPPORT',
        amount,
        currency: 'RWF',
        status: 'PENDING',
        txRef,
        customerEmail: req.user.email
      }
    });

    const flutterwavePayload = {
      tx_ref: txRef,
      amount,
      currency: 'RWF',
      redirect_url: redirectUrl,
      customer: {
        email: req.user.email,
        name: fullName
      },
      customizations: {
        title: 'Umunsi Premium Support',
        description: `Shyigikira Umunsi Premium - ${amount} RWF`,
        logo: `${getFrontendBaseUrl()}/images/logo.png`
      },
      meta: {
        userId: req.user.id,
        paymentId: paymentRecord.id,
        purpose: 'PREMIUM_SUPPORT'
      }
    };

    const response = await flutterwaveRequest('/payments', {
      method: 'POST',
      body: JSON.stringify(flutterwavePayload)
    });

    const checkoutUrl = response?.data?.link;
    if (!checkoutUrl) {
      throw new Error('Flutterwave did not return a checkout link');
    }

    await prisma.supportPayment.update({
      where: { id: paymentRecord.id },
      data: {
        checkoutUrl,
        providerStatus: String(response?.status || 'PENDING').toUpperCase(),
        metadata: JSON.stringify({
          responseStatus: response?.status || null,
          responseMessage: response?.message || null
        })
      }
    });

    return res.json({
      success: true,
      message: 'Checkout initialized successfully',
      data: {
        paymentId: paymentRecord.id,
        txRef,
        amount,
        currency: 'RWF',
        checkoutUrl
      }
    });
  } catch (error) {
    console.error('Flutterwave initialize error:', error);

    if (paymentRecord?.id) {
      await prisma.supportPayment.update({
        where: { id: paymentRecord.id },
        data: {
          status: 'FAILED',
          errorMessage: error.message
        }
      }).catch(() => null);
    }

    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to initialize payment',
      message: error.message || 'Failed to initialize payment'
    });
  }
});

router.get('/flutterwave/verify/:txRef', authenticateToken, async (req, res) => {
  try {
    const { txRef } = req.params;
    const payment = await prisma.supportPayment.findFirst({
      where: {
        txRef,
        userId: req.user.id
      }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    const result = await verifyAndSyncByTxRef(payment);

    return res.json({
      success: true,
      message: result.payment.status === 'SUCCESS' ? 'Payment verified and premium activated' : 'Payment not completed',
      data: {
        payment: result.payment,
        premium: result.premium
      }
    });
  } catch (error) {
    console.error('Flutterwave verify error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to verify payment',
      message: error.message
    });
  }
});

router.post('/flutterwave/webhook', async (req, res) => {
  try {
    const configuredHash = process.env.FLW_WEBHOOK_SECRET;
    const incomingHash = req.headers['verif-hash'];

    if (configuredHash && incomingHash !== configuredHash) {
      return res.status(401).json({
        success: false,
        error: 'Invalid webhook signature'
      });
    }

    const txRef = req.body?.data?.tx_ref;
    const txId = req.body?.data?.id;

    if (!txRef) {
      return res.status(200).json({ success: true, message: 'No tx_ref in webhook payload' });
    }

    const payment = await prisma.supportPayment.findUnique({ where: { txRef } });
    if (!payment) {
      return res.status(200).json({ success: true, message: 'Payment record not found for webhook' });
    }

    await verifyAndSyncByTxRef(payment, txId);

    return res.status(200).json({
      success: true,
      message: 'Webhook processed'
    });
  } catch (error) {
    console.error('Flutterwave webhook error:', error);
    return res.status(500).json({
      success: false,
      error: 'Webhook processing failed'
    });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const [user, payments] = await Promise.all([
      prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          isPremium: true,
          premiumSince: true,
          premiumUntil: true
        }
      }),
      prisma.supportPayment.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          provider: true,
          purpose: true,
          amount: true,
          currency: true,
          status: true,
          txRef: true,
          paidAt: true,
          createdAt: true
        }
      })
    ]);

    return res.json({
      success: true,
      data: {
        user,
        payments
      }
    });
  } catch (error) {
    console.error('Payment profile error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch payment history'
    });
  }
});

module.exports = router;
