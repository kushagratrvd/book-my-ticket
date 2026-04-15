import Joi from "joi";
import BaseDto from "../../../common/dto/base.dto.js";

class forgotPasswordDto extends BaseDto{
    static schema = Joi.object({
        email: Joi.string().max(60).lowercase().email().required()
    })
}

export default forgotPasswordDto;