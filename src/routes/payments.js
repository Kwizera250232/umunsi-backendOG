const express = require('express');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

const PREMIUM_SUPPORT_AMOUNT_RWF = Number(process.env.PREMIUM_SUPPORT_AMOUNT_RWF || 500);
const PREMIUM_DURATION_DAYS = Number(process.env.PREMIUM_DURATION_DAYS || 30);
const KPAY_DEFAULT_COUNTRY_CODE = String(process.env.KPAY_DEFAULT_COUNTRY_CODE || '250');

const buildTxRef = (userId) => {
  const suffix = userId ? userId.slice(-6) : 'guest';
  return `umunsi_${Date.now()}_${suffix}_${crypto.randomBytes(4).toString('hex')}`;
};

const getFrontendBaseUrl = () => {
  const configured = (process.env.FRONTEND_URL || '').trim();
  if (configured) return configured.replace(/\/$/, '');
  return process.env.NODE_ENV === 'production' ? 'https://umunsi.com' : 'http://localhost:5173';
};

const getBackendBaseUrl = (req) => {
  const configured = (process.env.BACKEND_URL || process.env.APP_URL || '').trim();
  if (configured) return configured.replace(/\/$/, '');
  if (req && req.protocol && req.get) {
    return `${req.protocol}://${req.get('host')}`;
  }
  return process.env.NODE_ENV === 'production' ? 'https://umunsi.com' : 'http://localhost:3000';
};

const isKpayConfigured = () => {
  const username = (process.env.KPAY_USERNAME || '').trim();
  const password = (process.env.KPAY_PASSWORD || '').trim();
  const retailerId = (process.env.KPAY_RETAILER_ID || '').trim();
  return Boolean(username && password && retailerId);
};

const normalizeMsisdn = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';

  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('0')) {
    digits = `${KPAY_DEFAULT_COUNTRY_CODE}${digits.slice(1)}`;
  }

  return digits;
};

const isKpaySuccessStatus = (value) => String(value || '').toUpperCase() === '01';
const isKpayPendingStatus = (value) => String(value || '').toUpperCase() === '03';

const safeParseJson = (value) => {
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch (error) {
    return {};
  }
};

const kpayRequest = async (payload) => {
  const username = (process.env.KPAY_USERNAME || '').trim();
  const password = (process.env.KPAY_PASSWORD || '').trim();
  const baseUrl = (process.env.KPAY_BASE_URL || 'https://pay.esicia.com').trim().replace(/\/$/, '');
  const apiPath = (process.env.KPAY_API_PATH || '/').trim();
  const requestUrl = `${baseUrl}${apiPath.startsWith('/') ? apiPath : `/${apiPath}`}`;

  const auth = Buffer.from(`${username}:${password}`).toString('base64');

  const response = await fetch(requestUrl, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const reason = data?.statusdesc || data?.message || data?.error || 'KPay request failed';
    throw new Error(reason);
  }

  return data;
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

const syncKpayPaymentByStatus = async (payment, kpayPayload = {}) => {
  const statusId = String(kpayPayload?.statusid || '').trim();
  const statusDesc = String(kpayPayload?.statusdesc || '').trim();
  const tid = String(kpayPayload?.tid || '').trim();
  const momTransactionId = String(kpayPayload?.momtransactionid || '').trim();
  const reply = String(kpayPayload?.reply || '').trim();

  if (isKpaySuccessStatus(statusId)) {
    const paidAt = new Date();
    const updatedPayment = await prisma.supportPayment.update({
      where: { id: payment.id },
      data: {
        status: 'SUCCESS',
        providerStatus: statusId,
        flwTransactionId: tid || payment.flwTransactionId,
        paidAt,
        errorMessage: null,
        metadata: JSON.stringify({
          ...safeParseJson(payment.metadata),
          kpayReply: reply || null,
          statusDesc: statusDesc || null,
          momtransactionid: momTransactionId || null,
          payaccount: kpayPayload?.payaccount || null
        })
      }
    });

    const premium = await applyPremiumActivation(payment.userId, paidAt);
    return { payment: updatedPayment, premium, isFinal: true };
  }

  if (isKpayPendingStatus(statusId) || (!statusId && String(kpayPayload?.retcode || '') === '0')) {
    const updatedPayment = await prisma.supportPayment.update({
      where: { id: payment.id },
      data: {
        status: 'PENDING',
        providerStatus: statusId || '03',
        flwTransactionId: tid || payment.flwTransactionId,
        metadata: JSON.stringify({
          ...safeParseJson(payment.metadata),
          kpayReply: reply || null,
          statusDesc: statusDesc || null,
          momtransactionid: momTransactionId || null,
          payaccount: kpayPayload?.payaccount || null
        })
      }
    });
    return { payment: updatedPayment, premium: null, isFinal: false };
  }

  const updatedPayment = await prisma.supportPayment.update({
    where: { id: payment.id },
    data: {
      status: 'FAILED',
      providerStatus: statusId || '02',
      flwTransactionId: tid || payment.flwTransactionId,
      errorMessage: statusDesc || 'KPay payment failed',
      metadata: JSON.stringify({
        ...safeParseJson(payment.metadata),
        kpayReply: reply || null,
        statusDesc: statusDesc || null,
        momtransactionid: momTransactionId || null,
        payaccount: kpayPayload?.payaccount || null
      })
    }
  });

  return { payment: updatedPayment, premium: null, isFinal: true };
};

router.post('/kpay/initialize', authenticateToken, async (req, res) => {
  let paymentRecord = null;
  try {
    if (!isKpayConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'KPay is not configured on this server yet.',
        message: 'Set KPAY_USERNAME, KPAY_PASSWORD and KPAY_RETAILER_ID then restart backend.'
      });
    }

    const amount = Number(req.body?.amount || PREMIUM_SUPPORT_AMOUNT_RWF);
    const pmethod = String(req.body?.pmethod || 'momo').trim().toLowerCase();
    const rawMsisdn = req.body?.msisdn;
    const msisdn = normalizeMsisdn(rawMsisdn);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid amount' });
    }

    if (!msisdn || msisdn.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number',
        message: 'Provide a valid mobile number. Example: 2507XXXXXXXX'
      });
    }

    const txRef = buildTxRef(req.user.id);
    const fullName = [req.user.firstName, req.user.lastName].filter(Boolean).join(' ').trim() || req.user.username;
    const frontendBaseUrl = getFrontendBaseUrl();
    const backendBaseUrl = getBackendBaseUrl(req);

    paymentRecord = await prisma.supportPayment.create({
      data: {
        userId: req.user.id,
        provider: 'KPAY',
        purpose: 'PREMIUM_SUPPORT',
        amount,
        currency: 'RWF',
        status: 'PENDING',
        txRef,
        customerEmail: req.user.email
      }
    });

    const kpayPayload = {
      action: 'pay',
      msisdn,
      email: req.user.email,
      details: `Dutere inkunga ya ${amount}/ ku kwezi usome inkuru za premium.`,
      refid: txRef,
      amount: Math.round(amount),
      currency: 'RWF',
      cname: fullName,
      cnumber: req.user.id,
      pmethod,
      retailerid: (process.env.KPAY_RETAILER_ID || '').trim(),
      returl: `${backendBaseUrl}/api/payments/kpay/webhook`,
      redirecturl: `${frontendBaseUrl}/subscriber/account?payment=callback&provider=kpay&txRef=${encodeURIComponent(txRef)}`,
      logourl: `${frontendBaseUrl}/images/logo.png`
    };

    const response = await kpayRequest(kpayPayload);

    const updatedPayment = await prisma.supportPayment.update({
      where: { id: paymentRecord.id },
      data: {
        checkoutUrl: response?.url || null,
        providerStatus: String(response?.statusid || response?.reply || response?.retcode || 'PENDING'),
        flwTransactionId: String(response?.tid || ''),
        metadata: JSON.stringify({
          kpayReply: response?.reply || null,
          kpayRetcode: response?.retcode ?? null,
          statusid: response?.statusid || null,
          statusdesc: response?.statusdesc || null,
          momtransactionid: response?.momtransactionid || null,
          authkey: response?.authkey || null,
          requestPmethod: pmethod,
          msisdn
        })
      }
    });

    let premium = null;
    if (isKpaySuccessStatus(response?.statusid)) {
      const syncResult = await syncKpayPaymentByStatus(updatedPayment, response);
      premium = syncResult.premium;
    }

    return res.json({
      success: true,
      message: premium ? 'Payment successful and premium activated' : 'Payment initialized successfully',
      data: {
        paymentId: paymentRecord.id,
        txRef,
        amount,
        currency: 'RWF',
        checkoutUrl: response?.url || null,
        providerReply: response,
        premium
      }
    });
  } catch (error) {
    console.error('KPay initialize error:', error);

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
      error: error.message || 'Failed to initialize KPay payment',
      message: error.message || 'Failed to initialize KPay payment'
    });
  }
});

router.get('/kpay/verify/:txRef', authenticateToken, async (req, res) => {
  try {
    if (!isKpayConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'KPay is not configured on this server yet.'
      });
    }

    const { txRef } = req.params;
    const payment = await prisma.supportPayment.findFirst({
      where: { txRef, userId: req.user.id }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    const statusPayload = {
      action: 'checkstatus',
      refid: payment.txRef,
      tid: payment.flwTransactionId || undefined
    };

    const providerReply = await kpayRequest(statusPayload);
    const syncResult = await syncKpayPaymentByStatus(payment, providerReply);

    return res.json({
      success: true,
      message: syncResult.payment.status === 'SUCCESS'
        ? 'Payment verified and premium activated'
        : syncResult.payment.status === 'PENDING'
          ? 'Payment still pending'
          : 'Payment failed',
      data: {
        payment: syncResult.payment,
        premium: syncResult.premium,
        providerReply
      }
    });
  } catch (error) {
    console.error('KPay verify error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to verify KPay payment',
      message: error.message
    });
  }
});

router.post('/kpay/webhook', async (req, res) => {
  try {
    const refid = String(req.body?.refid || '').trim();
    const tid = String(req.body?.tid || '').trim();

    if (!refid && !tid) {
      return res.status(200).json({
        tid,
        refid,
        reply: 'OK'
      });
    }

    const payment = await prisma.supportPayment.findFirst({
      where: refid
        ? { txRef: refid }
        : { flwTransactionId: tid }
    });

    if (payment) {
      await syncKpayPaymentByStatus(payment, req.body);
    }

    return res.status(200).json({
      tid,
      refid,
      reply: 'OK'
    });
  } catch (error) {
    console.error('KPay webhook error:', error);
    return res.status(200).json({
      tid: String(req.body?.tid || '').trim(),
      refid: String(req.body?.refid || '').trim(),
      reply: 'OK'
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
