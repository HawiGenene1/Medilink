const { registerTempPharmacy } = require("../controllers/tempPharmacyController");

router.post("/temp-register", registerTempPharmacy);
