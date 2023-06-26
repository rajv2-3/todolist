//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

require('dotenv').config();
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

if (!process.env.MONGODB) {
  throw new Error("MONGODB is not defined");
}

mongoose.connect(process.env.MONGODB).then(() => {
  console.log("Connected to MongoDB");
}).catch((error) => {
  console.log("Error connecting to MongoDB", error);
});

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);


const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", async function(req, res) {
  try {
    const foundItems = await Item.find({});
    if (foundItems.length === 0) {
      await Item.insertMany(defaultItems);
      return res.redirect("/");
    } else {
      return res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  } catch (error) {
    console.log(error);
  }
});

app.get("/:customListName", async function(req, res){
  const customListName = _.capitalize(req.params.customListName);
  try {
    const foundList = await List.findOne({name: customListName});
    if (foundList) {
      // Show an existing list
      return res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
    }
    const list = new List({
      name: customListName,
      items: defaultItems
    });
    list.save();
    return res.redirect(`/${customListName}`);
  } catch (error) {
    console.log(error);
  }
});

app.post("/", async function (req, res) {
  try { 
    const itemName = req.body.newItem;
    const listName = req.body.list;
    
    const item = new Item({
      name: itemName
    });
  
    if (listName === "Today"){
      item.save();
      return res.redirect("/");
    }
    
    const foundList = await List.findOne({ name: listName })
    foundList.items.push(item);
    foundList.save();
    return res.redirect("/" + listName);
  }
  catch (error) {
    console.log(error);
  }
});

app.post("/delete", async function (req, res) {
  try {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
      await Item.findByIdAndRemove(checkedItemId);
      console.log("Successfully deleted checked item.");
      return res.redirect("/");
    }
    await List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } });
    return res.redirect("/" + listName);
  } catch (error) {
    console.log(error);
  }
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
