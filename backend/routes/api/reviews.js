const express = require('express')
const { Spot, SpotImage, Review, User, Booking, ReviewImage } = require('../../db/models')
const { requireAuth, restoreUser } = require('../../utils/auth');
const { handleValidationErrors } = require('../../utils/validation')
const { Op } = require('sequelize');
const { check } = require('express-validator');


const router = express.Router()

const validateReviews = [
    check('review')
        .exists({ checkFalsy: true })
        .withMessage("Review text is required"),
    check('stars')
        .exists({ checkFalsy: true })
        .withMessage("Stars must be an integer from 1 to 5")
        .isInt({ min: 1, max: 5 }),
    handleValidationErrors
]

//Add an Image to a Review based on the Review's id
router.post('/:reviewId/images', requireAuth, async (req, res)=>{
    const { reviewId } = req.params
    const { url } = req.body

    const review = await Review.findByPk(reviewId)

    if(!review){
        return res.status(404).json({
            message: "Review couldn't be found"
        })
    }

    if(req.user.id !== review.userId){
        res.status(403).json({
            message:"Review must belong to the current user"
        })
    }
    //findall instead of findone
    const existImg = await ReviewImage.findAll({
        where: {
            reviewId: reviewId
        }
    })

    if(existImg.length >10){
        return res.status(403).json({
            message: "Maximum number of images for this resource was reached"
        })
    }

    const resp = await ReviewImage.create({
        reviewId: reviewId,
        url
    })

    res.json({
        id: resp.id,
        url: resp.url
    })
})

//edit a review
router.put('/:reviewId', [requireAuth,validateReviews], async (req, res)=>{

})

//delete a review
router.delete('/:reviewId', requireAuth, async (req, res)=>{

})

//Get all Reviews of the Current User
router.get("/current", requireAuth, async (req, res) => {
    const reviews = await Review.findAll({
        where: {
            userId: req.user.id
        },
        include: [
            {
                model: User,
                attributes: ['id', 'firstName', 'lastName']
            },
            {
                model: Spot,
                attributes: {
                    exclude: ['createdAt', 'updatedAt', 'description']
                },
                include: {
                    model: SpotImage,
                    where: {
                        preview: true
                    }, attributes: ['url']
                }
            },
            {
                model: ReviewImage,
                attributes: ['id', 'url']
            }
        ]
    })

    for (let i = 0; i < reviews.length; i++) {
        let json = reviews[i].toJSON();
        let spotURL = json.Spot.SpotImages[0]
        if (spotURL) {
            json.Spot.previewImage = spotURL.url
        } else {
            json.Spot.previewImage = null
        }
        //deletes url
        delete json.Spot.SpotImages
        reviews[i] = json
    }

    res.json({
        Reviews: reviews
    })
})







module.exports = router
