"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axiosInstance from '../utils/axiosConfig.ts';
import { getToken, getAssetUrl } from '../utils/auth.ts';

export interface CompanyProfile {
  id: string;
  name: string;
  address: string;
  contact_number: string;
  email: string;
  website: string;
  tagline: string;
  tax_number: string;
  currency_symbol: string;
  invoice_footer_notes: string;
  logo: string;
  favicon: string;
  logo_url: string | null;
  favicon_url: string | null;
  company_type: string;
  is_active: boolean;
}

interface CompanyContextType {
  company: CompanyProfile | null;
  loading: boolean;
  refreshCompany: () => Promise<void>;
  setPageTitle: (pageName: string) => void;
}

const CompanyContext = createContext<CompanyContextType>({
  company: null,
  loading: true,
  refreshCompany: async () => {},
  setPageTitle: () => {},
});

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCompanyProfile = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setCompany(null);
      setLoading(false);
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (link) {
        link.href = "/favicon.ico";
      }
      return;
    }

    try {
      const response = await axiosInstance.get('/company/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = response.data;
      if (data) {
        data.logo_url = getAssetUrl(data.logo_url);
        data.favicon_url = getAssetUrl(data.favicon_url);
      }
      setCompany(data);
      
      // Update DOM Favicon if company has a custom favicon
      if (data?.favicon_url) {
        let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'shortcut icon';
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = data.favicon_url;
      } else {
        let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
        if (link) {
          link.href = "/favicon.ico";
        }
      }
    } catch {
      // If error or unauthenticated, keep null
      setCompany(null);
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (link) {
        link.href = "/favicon.ico";
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanyProfile();

    // Listen for cross-tab storage events and same-tab companyAuthChange events (login/logout)
    const handleStorageChange = () => fetchCompanyProfile();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('companyAuthChange', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('companyAuthChange', handleStorageChange);
    };
  }, [fetchCompanyProfile]);

  const setPageTitle = useCallback((pageName: string) => {
    const companyName = company?.name || 'MBA NET';
    document.title = `${pageName} - ${companyName}`;
  }, [company]);

  return (
    <CompanyContext.Provider value={{
      company,
      loading,
      refreshCompany: fetchCompanyProfile,
      setPageTitle
    }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => useContext(CompanyContext);
