import twilio from 'twilio'
import env from '../../env'

export default twilio(env.twilio.sid, env.twilio.authToken)
