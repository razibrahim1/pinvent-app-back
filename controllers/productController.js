const asyncHandler = require("express-async-handler");
const Product = require("../models/productModel");
const { formatFileSize } = require("../utils/fileUpload");
const cloudinary = require("cloudinary").v2;

const createProduct = asyncHandler(async (req, res) => {
  const { name, sku, category, quantity, price, description } = req.body;

  try {
    // Validation
    if (!name || !category || !quantity || !price || !description) {
      return res.status(400).json({ error: "Please fill all fields" });
    }

    // Handle Image upload
    let fileData = {};
    if (req.file) {
      // Save file to Cloudinary
      let uploadedFile;
      try {
        uploadedFile = await cloudinary.uploader.upload(req.file.path, {
          folder: "Pinvent App",
          resource_type: "image",
        });
      } catch (error) {
        return res.status(500).json({ error: "Image could not be uploaded" });
      }

      fileData = {
        fileName: req.file.originalname,
        filePath: uploadedFile.secure_url,
        fileType: req.file.mimetype,
        fileSize: formatFileSize(req.file.size),
      };
    }

    // Create Product
    const product = await Product.create({
      user: req.user.id,
      name,
      sku,
      category,
      quantity,
      price,
      description,
      image: fileData,
    });

    return res.status(201).json(product);
  } catch (error) {
    console.error("Product creation error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

//Get single product

const getProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        res.status(404)
        throw new Error("Product not found")
    }

    if (product.user.toString() !== req.user.id) {
        res.status(401)
        throw new Error("User not Authorized")
    }
    res.status(200).json(product)

});


//Get all products

const getProducts = asyncHandler(async(req,res)=>{
    const products = await Product.find({user: req.user.id}).sort("-createdAt");
    res.status(200).json(products)
});

// Delete product
const deleteProduct = asyncHandler(async (req, res) => {
    const productId = req.params.id;
  
    try {
      const product = await Product.findById(productId);
  
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
  
      // Check if the user is the owner of the product
      if (product.user.toString() !== req.user.id) {
        return res.status(401).json({ error: "User not authorized to delete this product" });
      }
  
      // Delete the product using Mongoose's deleteOne method
      await Product.deleteOne({ _id: productId });
  
      return res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Product deletion error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
});

// Update product
const updateProduct = asyncHandler(async (req, res) => {
    const productId = req.params.id;
  
    try {
      const product = await Product.findById(productId);
  
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
  
      // Check if the user is the owner of the product
      if (product.user.toString() !== req.user.id) {
        return res.status(401).json({ error: "User not authorized to update this product" });
      }
  
      // Update product details
      product.name = req.body.name || product.name;
      product.sku = req.body.sku || product.sku;
      product.category = req.body.category || product.category;
      product.quantity = req.body.quantity || product.quantity;
      product.price = req.body.price || product.price;
      product.description = req.body.description || product.description;
  
      // Handle Image update
      if (req.file) {
        // Save the new image to Cloudinary
        let uploadedFile;
        try {
          uploadedFile = await cloudinary.uploader.upload(req.file.path, {
            folder: "Pinvent App",
            resource_type: "image",
          });
        } catch (error) {
          return res.status(500).json({ error: "Image could not be uploaded" });
        }
  
        product.image = {
          fileName: req.file.originalname,
          filePath: uploadedFile.secure_url,
          fileType: req.file.mimetype,
          fileSize: formatFileSize(req.file.size),
        };
      }
  
      // Save the updated product
      await product.save();
  
      return res.status(200).json({ message: "Product updated successfully" });
    } catch (error) {
      console.error("Product update error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });  



module.exports = {
  createProduct,
  getProducts,
  getProduct,
  deleteProduct,
  updateProduct,
};
