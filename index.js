const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require('body-parser');
const path = require('path');

const port = 8000;
const outputDir = path.join(__dirname, 'outputs');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
const DB_HOST = process.env.MONGODB_HOST;

mongoose
    .connect(DB_HOST, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log(err));

const rootRouter = require("./routes");

app.use("/api", rootRouter);
app.use('/api/uploads', express.static('uploads'));

app.get('/api/outputs/:fileName', (req, res) => {
    const fileName = req.params.fileName;
    const filePath = path.join(outputDir, fileName);

    res.download(filePath, fileName, (err) => {
        if (err) {
            console.error(`Error occurred while downloading the file: ${err}`);
            res.status(500).send("An error occurred while downloading the file.");
        }
    });
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});