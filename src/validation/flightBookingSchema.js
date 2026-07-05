'use strict';

const Joi = require('joi');

const travelerNameSchema = Joi.object({
  firstName: Joi.string().trim().min(1).max(50).required(),
  lastName: Joi.string().trim().min(1).max(50).required()
}).required();

const documentSchema = Joi.object({
  documentType: Joi.string().trim().valid('PASSPORT', 'ID_CARD', 'VISA').required(),
  number: Joi.string().trim().min(3).max(30).required(),
  expiryDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  issuanceCountry: Joi.string().trim().length(2).uppercase().required(),
  validityCountry: Joi.string().trim().length(2).uppercase().required(),
  nationality: Joi.string().trim().length(2).uppercase().required(),
  holder: Joi.boolean().required()
});

const contactSchema = Joi.object({
  emailAddress: Joi.string().email().required(),
  phones: Joi.array()
    .items(
      Joi.object({
        deviceType: Joi.string().valid('MOBILE', 'LANDLINE').required(),
        countryCallingCode: Joi.string().pattern(/^\d{1,4}$/).required(),
        number: Joi.string().pattern(/^\d{6,15}$/).required()
      })
    )
    .min(1)
    .required()
}).required();

const travelerSchema = Joi.object({
  id: Joi.string().trim().required(),
  dateOfBirth: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  name: travelerNameSchema,
  gender: Joi.string().valid('MALE', 'FEMALE', 'UNSPECIFIED').required(),
  contact: contactSchema,
  documents: Joi.array().items(documentSchema).min(1).required()
}).required();

const flightOfferSchema = Joi.object({
  type: Joi.string().valid('flight-offer').required()
}).unknown(true);

const bookingSchema = Joi.object({
  data: Joi.object({
    type: Joi.string().valid('flight-order').required(),
    flightOffers: Joi.array().items(flightOfferSchema).min(1).required(),
    travelers: Joi.array().items(travelerSchema).min(1).required(),
    remarks: Joi.object().optional(),
    ticketingAgreement: Joi.object().optional(),
    contacts: Joi.array().optional()
  }).required()
}).required();

function validateBookingPayload(payload) {
  const { error, value } = bookingSchema.validate(payload, {
    abortEarly: false,
    stripUnknown: false
  });

  if (!error) return { value, error: null };

  return {
    value: null,
    error: error.details.map((d) => ({
      path: d.path.join('.'),
      message: d.message
    }))
  };
}

module.exports = {
  validateBookingPayload
};