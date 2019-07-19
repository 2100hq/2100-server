const Joi = require('joi')

module.exports = config => props => {
  const schema = Joi.object({
    id: Joi.string().required(),
    type: Joi.string().required(),
  }).unknown()

  Joi.assert(props, schema)

  return props
}



