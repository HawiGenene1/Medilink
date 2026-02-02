import apiClient from './config';
import authAPI from './auth';
import medicinesAPI from './medicines';
import { ordersAPI } from './orders';
import { pharmacyStaffAPI } from './pharmacyStaff';
import { pharmacyAdminAPI } from './pharmacyAdmin';
import * as prescriptionsAPI from './prescriptions';

export {
    apiClient as default,
    authAPI as auth,
    medicinesAPI as medicines,
    ordersAPI as orders,
    pharmacyStaffAPI as pharmacyStaff,
    pharmacyAdminAPI as pharmacyAdmin,
    prescriptionsAPI as prescriptions
};
