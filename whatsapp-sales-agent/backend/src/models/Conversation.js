const { mongoose } = require('../db');

const ConversationSchema = new mongoose.Schema(
  {
    lead_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
    direction: { type: String, enum: ['inbound', 'outbound'], required: true },
    message: { type: String, required: true },
    intent: String,
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

ConversationSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    ret.id = ret._id;
    delete ret._id;
  },
});

module.exports = mongoose.model('Conversation', ConversationSchema);
