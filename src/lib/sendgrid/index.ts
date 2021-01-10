import sendgridClient from '@sendgrid/mail'
import env from '../../env'

sendgridClient.setApiKey(env.sendgrid.apiKey)

export default sendgridClient
