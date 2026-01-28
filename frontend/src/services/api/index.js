import apiClient from './config';
import authAPI from './auth';
import medicinesAPI from './medicines';
import ordersAPI from './orders';
import dummyStaffAPI from './pharmacyStaff';
import dummyAdminAPI from './pharmacyAdmin';
import prescriptionsAPI from './prescriptions';

export {
    apiClient as default,
    authAPI as auth,
    medicinesAPI as medicines,
    ordersAPI as orders,
    dummyStaffAPI as pharmacyStaff,
    dummyAdminAPI as pharmacyAdmin,
    prescriptionsAPI as prescriptions
};
