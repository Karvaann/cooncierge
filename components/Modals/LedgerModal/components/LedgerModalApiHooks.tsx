"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import BankApi, { type BankDto } from "@/services/bankApi";
import PaymentsApi from "@/services/paymentsApi";
import CustomIdApi from "@/services/customIdApi";
import BookingApiService from "@/services/bookingApi";
import { getCustomerById } from "@/services/customerApi";
import { getVendorById } from "@/services/vendorApi";

const extractBankList = (resp: any): BankDto[] => {
  if (Array.isArray(resp)) return resp;
  if (Array.isArray(resp?.banks)) return resp.banks;
  if (Array.isArray(resp?.data)) return resp.data;
  if (Array.isArray(resp?.data?.banks)) return resp.data.banks;
  return [];
};

export const useLedgerBanks = ({ enabled }: { enabled: boolean }) => {
  const [banks, setBanks] = useState<BankDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchBanks = useCallback(async () => {
    setIsLoading(true);
    try {
      const resp: any = await BankApi.getBanks({ isDeleted: false });
      if (!mountedRef.current) return;
      setBanks(extractBankList(resp));
    } catch (err) {
      console.error("Failed to fetch banks:", err);
      if (!mountedRef.current) return;
      setBanks([]);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    fetchBanks();
  }, [enabled, fetchBanks]);

  return { banks, isBanksLoading: isLoading, fetchBanks };
};

export const useLedgerData = ({
  enabled,
  rawId,
  isVendorLedger,
}: {
  enabled: boolean;
  rawId: string | null;
  isVendorLedger: boolean;
}) => {
  const [ledgerData, setLedgerData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchLedger = useCallback(async () => {
    try {
      if (!rawId) return;
      setIsLoading(true);
      const data = isVendorLedger
        ? await PaymentsApi.getVendorLedger(rawId)
        : await PaymentsApi.getCustomerLedger(rawId);
      if (!mountedRef.current) return;
      setLedgerData(data);
    } catch (err) {
      console.error("Failed to fetch ledger:", err);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [rawId, isVendorLedger]);

  useEffect(() => {
    if (!enabled) return;
    fetchLedger();
  }, [enabled, fetchLedger]);

  return { ledgerData, isLedgerLoading: isLoading, fetchLedger };
};

const normalizeMongoId = (value: unknown): string => {
  try {
    if (!value) return "";
    if (typeof value === "string") return value.trim();
    if (typeof value === "object") {
      const maybeId = (value as any)?._id ?? (value as any)?.id;
      return typeof maybeId === "string" ? maybeId.trim() : "";
    }
    return "";
  } catch {
    return "";
  }
};

export const useLedgerQuotationApi = () => {
  const withHydratedPartyObjects = useCallback(async (quotation: any) => {
    try {
      if (!quotation) return quotation;

      const customerIdVal = normalizeMongoId(quotation.customerId);
      const vendorIdVal = normalizeMongoId(quotation.vendorId);

      const shouldFetchCustomer =
        Boolean(customerIdVal) &&
        (typeof quotation.customerId !== "object" ||
          !quotation.customerId?._id ||
          !quotation.customerId?.name);
      const shouldFetchVendor =
        Boolean(vendorIdVal) &&
        (typeof quotation.vendorId !== "object" ||
          !quotation.vendorId?._id ||
          (!quotation.vendorId?.companyName &&
            !quotation.vendorId?.contactPerson));

      const [customer, vendor] = await Promise.all([
        shouldFetchCustomer
          ? getCustomerById(customerIdVal).catch(() => null)
          : Promise.resolve(null),
        shouldFetchVendor
          ? getVendorById(vendorIdVal).catch(() => null)
          : Promise.resolve(null),
      ]);

      return {
        ...quotation,
        customerId: customer
          ? {
              _id: customer._id,
              name: customer.name,
              email: customer.email,
              phone: customer.phone,
            }
          : quotation.customerId,
        vendorId: vendor
          ? {
              _id: vendor._id,
              companyName: vendor.companyName,
              contactPerson: vendor.contactPerson,
              email: vendor.email,
              phone: vendor.phone,
            }
          : quotation.vendorId,
      };
    } catch (err) {
      console.error("Failed to hydrate customer/vendor:", err);
      return quotation;
    }
  }, []);

  const getHydratedQuotationById = useCallback(
    async (quotationId: string): Promise<any | null> => {
      try {
        if (!quotationId) return null;
        const resp = await BookingApiService.getQuotationById(quotationId);
        if (!resp?.success) return null;

        const apiPayload: any = resp.data;
        const quotation = apiPayload?.quotation;
        if (!quotation) return null;

        return await withHydratedPartyObjects(quotation);
      } catch (err) {
        console.error("Failed to fetch quotation:", err);
        return null;
      }
    },
    [withHydratedPartyObjects],
  );

  const deleteQuotation = useCallback(async (quotationId: string) => {
    try {
      if (!quotationId) {
        return { success: false as const, message: "Missing quotation id" };
      }
      const resp = await BookingApiService.deleteQuotation(quotationId);
      return {
        success: Boolean(resp?.success),
        message: resp?.message,
        data: resp?.data,
      };
    } catch (err) {
      console.error("Error deleting quotation:", err);
      return { success: false as const, message: "Failed to delete quotation" };
    }
  }, []);

  return {
    withHydratedPartyObjects,
    getHydratedQuotationById,
    deleteQuotation,
  };
};

export const usePaymentCustomId = () => {
  const generatePaymentCustomId = useCallback(
    async (type: "paymentOut" | "paymentIn") => {
      try {
        const resp: any = await CustomIdApi.generate(type);
        const id =
          resp?.customId ||
          resp?.data?.customId ||
          resp?.id ||
          (typeof resp === "string" ? resp : null) ||
          null;
        return id as string | null;
      } catch (err) {
        console.error("Failed to generate custom id:", err);
        return null;
      }
    },
    [],
  );

  return { generatePaymentCustomId };
};
