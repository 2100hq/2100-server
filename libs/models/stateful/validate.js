const Joi = require('joi')

module.exports = config => props => {
  const schema = Joi.object({
    state: Joi.string().required(),
    created: Joi.number().required(),
    updated: Joi.number().required(),
    done: Joi.boolean().required()
  }).unknown()
  Joi.assert(props, schema)
  return props
}
