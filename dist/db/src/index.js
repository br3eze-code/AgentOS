"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbHelpers = void 0;
// Emulate Prisma's getPrisma behavior loosely to slowly refactor the codebase to Firestore
const kernel_1 = require("@agentclaw/kernel");
exports.dbHelpers = {
    getVoucher: async (id) => {
        const doc = await (0, kernel_1.getFirestore)().collection('vouchers').doc(id).get();
        return doc.exists ? doc.data() : null;
    },
    // Add other helpers as needed
};
//# sourceMappingURL=index.js.map