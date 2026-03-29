const { mongoose } = require('../db');

const LeadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    business_type: String,
    city: String,
    address: String,
    rating: Number,
    source: { type: String, default: 'apify' },
    status: {
      type: String,
      enum: ['pending', 'contacted', 'interested', 'hot', 'dead', 'converted'],
      default: 'pending',
    },
    message_sent: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

LeadSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    ret.id = ret._id;
    delete ret._id;
  },
});

module.exports = mongoose.model('Lead', LeadSchema);
