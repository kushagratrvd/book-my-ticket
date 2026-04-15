import Joi from "joi"
import BaseDto from "../../../common/dto/base.dto.js"

class resetPasswordDto extends BaseDto{
    static schema = Joi.object({
        password: Joi.string()
        .min(6)
        .pattern(/(?=.*[A-Z])(?=.*\d)/)
        .message(
            "Password must contain at least one uppercase letter and one digit",
        )
        .max(50)
        .required()
    })
}

export default resetPasswordDto;