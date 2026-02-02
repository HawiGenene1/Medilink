const FilterService = require('../services/filterService');
const Medicine = require('../models/Medicine');
const Order = require('../models/Order');

describe('FilterService', () => {
  describe('buildFilter', () => {
    it('should build filter with single category', () => {
      const queryParams = { category: 'otc' };
      const filter = FilterService.buildFilter(queryParams);
      expect(filter.category).toBe('otc');
    });

    it('should build filter with multiple categories', () => {
      const queryParams = { categories: 'otc,prescription' };
      const filter = FilterService.buildFilter(queryParams);
      expect(filter.category.$in).toEqual(['otc', 'prescription']);
    });

    it('should build price range filter', () => {
      const queryParams = { minPrice: '10', maxPrice: '50' };
      const filter = FilterService.buildFilter(queryParams);
      expect(filter.price.$gte).toBe(10);
      expect(filter.price.$lte).toBe(50);
    });

    it('should build stock filter', () => {
      const queryParams = { inStock: 'true' };
      const filter = FilterService.buildFilter(queryParams);
      expect(filter.stock.$gt).toBe(0);
    });

    it('should build search filter with specified fields', () => {
      const queryParams = { search: 'aspirin' };
      const options = { searchFields: ['name', 'description'] };
      const filter = FilterService.buildFilter(queryParams, options);
      expect(filter.$or).toHaveLength(2);
      expect(filter.$or[0].name.$regex).toBe('aspirin');
    });
  });

  describe('buildSort', () => {
    it('should use default sort when no sortBy provided', () => {
      const defaultSort = { createdAt: -1 };
      const sort = FilterService.buildSort({}, defaultSort);
      expect(sort).toEqual(defaultSort);
    });

    it('should build custom sort', () => {
      const queryParams = { sortBy: 'price', sortOrder: 'asc' };
      const sort = FilterService.buildSort(queryParams);
      expect(sort.price).toBe(1);
    });

    it('should use descending order by default', () => {
      const queryParams = { sortBy: 'name' };
      const sort = FilterService.buildSort(queryParams);
      expect(sort.name).toBe(-1);
    });
  });

  describe('buildPagination', () => {
    it('should build pagination with default values', () => {
      const pagination = FilterService.buildPagination({});
      expect(pagination.page).toBe(1);
      expect(pagination.limit).toBe(10);
      expect(pagination.skip).toBe(0);
    });

    it('should build pagination with custom values', () => {
      const queryParams = { page: '2', limit: '20' };
      const pagination = FilterService.buildPagination(queryParams);
      expect(pagination.page).toBe(2);
      expect(pagination.limit).toBe(20);
      expect(pagination.skip).toBe(20);
    });

    it('should limit maximum page size to 100', () => {
      const queryParams = { limit: '200' };
      const pagination = FilterService.buildPagination(queryParams);
      expect(pagination.limit).toBe(100);
    });
  });
});

describe('FilterUtils', () => {
  const { validateFilters, generateFilterSummary, sanitizeSearchTerm } = require('../utils/filterUtils');

  describe('validateFilters', () => {
    it('should validate string parameters', () => {
      const schema = { category: { type: 'string', required: true } };
      const { validated, errors } = validateFilters({ category: '  otc  ' }, schema);
      expect(validated.category).toBe('otc');
      expect(errors).toHaveLength(0);
    });

    it('should validate number parameters', () => {
      const schema = { minPrice: { type: 'number' } };
      const { validated, errors } = validateFilters({ minPrice: '25.5' }, schema);
      expect(validated.minPrice).toBe(25.5);
      expect(errors).toHaveLength(0);
    });

    it('should validate boolean parameters', () => {
      const schema = { inStock: { type: 'boolean' } };
      const { validated, errors } = validateFilters({ inStock: 'true' }, schema);
      expect(validated.inStock).toBe(true);
      expect(errors).toHaveLength(0);
    });

    it('should validate array parameters', () => {
      const schema = { categories: { type: 'array' } };
      const { validated, errors } = validateFilters({ categories: 'otc,prescription' }, schema);
      expect(validated.categories).toEqual(['otc', 'prescription']);
      expect(errors).toHaveLength(0);
    });
  });

  describe('generateFilterSummary', () => {
    it('should generate summary for active filters', () => {
      const filters = {
        search: 'aspirin',
        category: 'otc',
        minPrice: 10,
        maxPrice: 50,
        inStock: true
      };
      const summary = generateFilterSummary(filters);
      expect(summary.activeFilters).toContain('Search: "aspirin"');
      expect(summary.activeFilters).toContain('Category: otc');
      expect(summary.activeFilters).toContain('Price: $10 - $50');
      expect(summary.activeFilters).toContain('In Stock Only');
      expect(summary.hasFilters).toBe(true);
      expect(summary.filterCount).toBe(4);
    });

    it('should return empty summary for no filters', () => {
      const summary = generateFilterSummary({});
      expect(summary.activeFilters).toHaveLength(0);
      expect(summary.hasFilters).toBe(false);
      expect(summary.filterCount).toBe(0);
    });
  });

  describe('sanitizeSearchTerm', () => {
    it('should remove dangerous characters', () => {
      const searchTerm = sanitizeSearchTerm('test{$}search');
      expect(searchTerm).toBe('testsearch');
    });

    it('should limit length', () => {
      const longTerm = 'a'.repeat(150);
      const searchTerm = sanitizeSearchTerm(longTerm);
      expect(searchTerm.length).toBe(100);
    });

    it('should handle null/undefined input', () => {
      expect(sanitizeSearchTerm(null)).toBe('');
      expect(sanitizeSearchTerm(undefined)).toBe('');
    });
  });
});

// Integration tests (would require database connection)
describe('FilterService Integration', () => {
  // These tests would require a test database setup
  // For now, they serve as examples of how to test the service

  describe('filterMedicines', () => {
    it('should filter medicines by category', async () => {
      // Mock Medicine.find to avoid database dependency
      const mockMedicines = [
        { name: 'Aspirin', category: 'otc', price: 10 },
        { name: 'Amoxicillin', category: 'prescription', price: 25 }
      ];
      
      jest.spyOn(Medicine, 'find').mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(mockMedicines)
            })
          })
        })
      });

      jest.spyOn(Medicine, 'countDocuments').mockResolvedValue(2);

      const result = await FilterService.filterMedicines({ category: 'otc' });
      
      expect(result.medicines).toBeDefined();
      expect(result.pagination).toBeDefined();
      expect(result.pagination.totalItems).toBe(2);
    });
  });

  describe('filterOrders', () => {
    it('should filter orders by status', async () => {
      const mockOrders = [
        { orderNumber: 'ORD-001', status: 'pending' },
        { orderNumber: 'ORD-002', status: 'delivered' }
      ];
      
      jest.spyOn(Order, 'find').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockOrders)
      });

      jest.spyOn(Order, 'countDocuments').mockResolvedValue(2);

      const result = await FilterService.filterOrders({ status: 'pending' });
      
      expect(result.orders).toBeDefined();
      expect(result.pagination).toBeDefined();
      expect(result.pagination.totalItems).toBe(2);
    });
  });
});
