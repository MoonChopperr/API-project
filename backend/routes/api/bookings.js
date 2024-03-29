const express = require('express')
const { Spot, SpotImage, Review, User, Booking, ReviewImage } = require('../../db/models')
const { requireAuth, restoreUser } = require('../../utils/auth');
const { handleValidationErrors } = require('../../utils/validation')
const { Op } = require('sequelize');
const { check } = require('express-validator');

const router = express.Router()

// const validateDates = [
//     check('startDate')
//         .exists({ checkFalsy: true })
//         .custom((val, { req }) => {
//             const currentDate = new Date()
//             if (new Date(val) < currentDate) {
//                 throw new Error("StartDate cannot be in the past")
//             }
//             return true
//         }),
//     check('endDate')
//         .exists({ checkFalsy: true })
//         .custom((val, { req }) => {
//             const startDate = new Date(req.body.startDate)
//             if (new Date(val) <= startDate) {
//                 throw new Error("endDate cannot be on or before startDate")
//             }
//             return true
//         }),
//     handleValidationErrors
// ]

//Get all current User's Bookings
router.get('/current', requireAuth, async (req, res) => {
    const userId = req.user.id
    const bookings = await Booking.findAll({
        where: {
            userId: userId
        }, include: [
            {
                model: Spot,
                attributes: {
                    exclude: ['description', 'createdAt', 'updatedAt']
                }
            }
        ]

    })

    for (let i = 0; i < bookings.length; i++) {
        let json = bookings[i].toJSON()
        // console.log(json)

        const previewimage = await SpotImage.findOne({
            where: {
                spotId: json.Spot.id,
                preview: true
            }
        })
        // console.log(previewimage)

        if (previewimage) {
            json.Spot.previewImage = previewimage.url
        } else {
            json.Spot.previewImage = null
        }

        if (json.Spot.lat) {
            json.Spot.lat = parseFloat(json.Spot.lat)
        }


        if (json.Spot.lng) {
            json.Spot.lng = parseFloat(json.Spot.lng)
        }


        if (json.Spot.price) {
            json.Spot.price = parseFloat(json.Spot.price)
        }

        bookings[i] = json
    }

    res.json({
        Bookings: bookings
    })
})


//edit a booking
router.put('/:bookingId', requireAuth, async (req, res) => {
    const { bookingId } = req.params
    const { startDate, endDate } = req.body
    const bookings = await Booking.findByPk(bookingId)

    //404
    if (!bookings) {
        return res.status(404).json({
            message: "Booking couldn't be found"
        })
    }

    let currentDate = new Date()
    if (new Date(startDate) < currentDate || new Date(endDate) < currentDate) {
        return res.status(403).json({
            message: "Past bookings can't be modified"
        })
    }

    if (new Date(startDate) < currentDate) {
        return res.status(400).json({
            message: "Bad Request",
            errors: {
                startDate: "startDate cannot be in the past"
            }
        })
    }

    if (new Date(endDate) <= new Date(startDate)) {
        return res.status(400).json({
            message: "Bad Request",
            errors: {
                endDate: "endDate cannot be on or before startDate"
            }
        })
    }
    //if already booked for specified dates
    const existBooking = await Booking.findOne({
        where: {
            id: {
                [Op.ne]: bookingId
            },
            spotId: bookings.spotId,
            [Op.and]:
                [
                    {
                        startDate: {
                            [Op.lte]: new Date(endDate)
                        }
                    },
                    {
                        endDate: {
                            [Op.gte]: new Date(startDate)
                        }
                    }
                ]
        }
    })

    if (existBooking) {
        return res.status(403).json({
            message: "Sorry, this spot is already booked for the specified dates",
            errors: {
                startDate: "Start date conflicts with an existing booking",
                endDate: "End date conflicts with an existing booking"
            }
        })
    }


    if (req.user.id !== bookings.userId) {
        return res.status(403).json({
            message: "Forbidden"
        })
    }

    bookings.startDate = startDate
    bookings.endDate = endDate
    await bookings.save()

    res.json(bookings)

})


//delete a booking
router.delete('/:bookingId', requireAuth, async (req, res) => {
    const { bookingId } = req.params
    const bookings = await Booking.findByPk(bookingId)
    if (!bookings) {
        return res.status(404).json({
            message: "Booking couldn't be found"
        })
    }

    if (bookings.userId !== req.user.id) {
        return res.status(403).json({
            message: "Forbidden"
        })
    }

    if (new Date(bookings.startDate) <= new Date()) {
        return res.status(403).json({
            message: "Bookings that have been started can't be deleted"
        })
    }

    await bookings.destroy()
    res.json({
        message: "Successfully deleted"
    })
})

module.exports = router
