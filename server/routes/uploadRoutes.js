import path from 'path'
import express from 'express'
import multer from 'multer'
const router = express.Router()

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/')
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    )
  },
})

function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png/
  const extname = filetypes.test(
    path.extname(file.originalname).toLowerCase()
  )
  const mimetype = filetypes.test(file.mimetype)

  if (extname && mimetype) {
    return cb(null, true)
  } else {
    cb('Images only!')
  }
}

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb)
  },
})

// POST /api/upload — upload nhiều ảnh, tối đa 5
router.post('/', upload.array('images', 5), (req, res) => {
  // req.files là mảng các file
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'No files uploaded' })
  }

  // lấy đường dẫn relative hoặc URL
  const filePaths = req.files.map((file) => {
    // ví dụ trả về `/uploads/filename.ext`
    return `/${file.path.replace(/\\/g, '/')}`
  })

  res.status(201).json({ paths: filePaths })
})

export default router
