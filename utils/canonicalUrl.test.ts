/**
 * Unit tests for canonicalUrl utility functions
 */

import {
  normalizeUrl,
  getCanonicalUrl,
  getCanonicalPath,
} from './canonicalUrl';

describe('canonicalUrl utilities', () => {
  describe('normalizeUrl', () => {
    it('should remove query strings', () => {
      const input = 'https://yourcvpassport.com/pricing?lang=es&utm_source=google';
      const expected = 'https://yourcvpassport.com/pricing';
      expect(normalizeUrl(input)).toBe(expected);
    });

    it('should remove hash fragments', () => {
      const input = 'https://yourcvpassport.com/pricing#section';
      const expected = 'https://yourcvpassport.com/pricing';
      expect(normalizeUrl(input)).toBe(expected);
    });

    it('should remove trailing slash (except root)', () => {
      const input = 'https://yourcvpassport.com/pricing/';
      const expected = 'https://yourcvpassport.com/pricing';
      expect(normalizeUrl(input)).toBe(expected);
    });

    it('should keep root trailing slash', () => {
      const input = 'https://yourcvpassport.com/';
      const expected = 'https://yourcvpassport.com/';
      expect(normalizeUrl(input)).toBe(expected);
    });

    it('should remove both query string and trailing slash', () => {
      const input = 'https://yourcvpassport.com/pricing/?lang=es';
      const expected = 'https://yourcvpassport.com/pricing';
      expect(normalizeUrl(input)).toBe(expected);
    });

    it('should handle invalid URLs gracefully', () => {
      const input = 'not-a-valid-url';
      expect(normalizeUrl(input)).toBe(input);
    });

    it('should handle URLs with port numbers', () => {
      const input = 'http://localhost:3000/pricing?test=1';
      const expected = 'http://localhost:3000/pricing';
      expect(normalizeUrl(input)).toBe(expected);
    });
  });

  describe('getCanonicalUrl', () => {
    it('should generate canonical URL from English path', () => {
      const result = getCanonicalUrl('pricing');
      expect(result).toBe('https://yourcvpassport.com/pricing');
    });

    it('should add leading slash if missing', () => {
      const result = getCanonicalUrl('product/overview');
      expect(result).toBe('https://yourcvpassport.com/product/overview');
    });

    it('should not double up slashes', () => {
      const result = getCanonicalUrl('/pricing');
      expect(result).toBe('https://yourcvpassport.com/pricing');
    });

    it('should handle root path', () => {
      const result = getCanonicalUrl('');
      expect(result).toBe('https://yourcvpassport.com/');
    });
  });

  describe('getCanonicalPath', () => {
    describe('Spanish to English mappings', () => {
      it('should map /precios to /pricing', () => {
        expect(getCanonicalPath('/precios')).toBe('/pricing');
      });

      it('should map /producto/resumen to /product/overview', () => {
        expect(getCanonicalPath('/producto/resumen')).toBe('/product/overview');
      });

      it('should map /empresas/planes to /companies/plans', () => {
        expect(getCanonicalPath('/empresas/planes')).toBe('/companies/plans');
      });

      it('should map /profesionales/plantillas to /professionals/templates', () => {
        expect(getCanonicalPath('/profesionales/plantillas')).toBe('/professionals/templates');
      });

      it('should map /recursos/blog to /resources/blog', () => {
        expect(getCanonicalPath('/recursos/blog')).toBe('/resources/blog');
      });

      it('should map /nosotros to /about', () => {
        expect(getCanonicalPath('/nosotros')).toBe('/about');
      });
    });

    describe('Dynamic routes', () => {
      it('should map /perfiles/* to /profiles/*', () => {
        expect(getCanonicalPath('/perfiles/spain/madrid/developer')).toBe('/profiles/spain/madrid/developer');
      });

      it('should map /recursos/blog/* to /resources/blog/*', () => {
        expect(getCanonicalPath('/recursos/blog/my-post')).toBe('/resources/blog/my-post');
      });
    });

    describe('Trailing slashes', () => {
      it('should handle trailing slash in Spanish route', () => {
        expect(getCanonicalPath('/precios/')).toBe('/pricing');
      });

      it('should not remove trailing slash from root', () => {
        expect(getCanonicalPath('/')).toBe('/');
      });
    });

    describe('English routes (no mapping needed)', () => {
      it('should return English routes as-is', () => {
        expect(getCanonicalPath('/pricing')).toBe('/pricing');
      });

      it('should return /product/overview as-is', () => {
        expect(getCanonicalPath('/product/overview')).toBe('/product/overview');
      });

      it('should return root as-is', () => {
        expect(getCanonicalPath('/')).toBe('/');
      });
    });
  });

  describe('Integration tests', () => {
    it('should handle complete flow: ES route → canonical path → full URL', () => {
      const spanishRoute = '/precios';
      const canonicalPath = getCanonicalPath(spanishRoute);
      const fullCanonical = getCanonicalUrl(canonicalPath);

      expect(fullCanonical).toBe('https://yourcvpassport.com/pricing');
    });

    it('should normalize URL with query params and trailing slash', () => {
      const messyUrl = 'https://yourcvpassport.com/pricing/?lang=es&utm_source=google#section';
      const normalized = normalizeUrl(messyUrl);

      expect(normalized).toBe('https://yourcvpassport.com/pricing');
    });
  });
});
