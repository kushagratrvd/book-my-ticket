import Joi from "joi"
import BaseDto from "../../../common/dto/base.dto.js"

class LoginDto extends BaseDto{
    static schema = Joi.object({
        email: Joi.string().min(2).max(60).email().lowercase().required(),
        password: Joi.string().min(6).max(70).required()
    })
}

export default LoginDto
