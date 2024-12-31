const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  serviceId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ServiceMaster'  }],
  packageId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PackageMaster'}]
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);