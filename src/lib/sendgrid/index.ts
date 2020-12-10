import sgMail from '@sendgrid/mail'
import env from '../../env'

sgMail.setApiKey(env.sendgrid.apiKey)

export default sgMail
