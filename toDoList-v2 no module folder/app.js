//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const dotenv = require("dotenv");
const password = process.env['PASS'];

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(`mongodb+srv://admin-hephzibah:${password}@atlascluster.uf4ejqd.mongodb.net/todoListDB`);

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your To-Do List!"
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

app.get("/", function (req, res) {

  Item.find({})
    .then(function (items) {
      if (items.length === 0) {
        Item.insertMany(defaultItems)
          .then(function () {
            console.log("Successfully added docs.");
          })
          .catch(function (err) {
            console.log(err);
          });
        res.redirect("/");
      } else {
        res.render("list", { listTitle: "Today", newListItems: items });
      }
    })
    .catch(function (err) {
      console.log(err);
    });
});

app.get("/:customListTitle", function (req, res) {
  const customListTitle = _.capitalize(req.params.customListTitle);

  const list = new List({
    name: customListTitle,
    items: defaultItems,
  })

  List.findOne({ name: customListTitle })
    .then(function (doc) {
      if (doc === null) {
        // create new list
        list.save()
          .then(() => console.log("List created."))
          .catch((err) => console.log(err));
        res.redirect(`/${customListTitle}`);
      } else {
        // show existing list
        res.render("list", { listTitle: doc.name, newListItems: doc.items })
      }
    })
    .catch((err) => console.log(err));

})

app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: itemName
  });

  if (listName === "Today") {
    newItem.save()
      .then(() => console.log("Item added."))
      .catch((err) => console.log(err));

    res.redirect("/");
  } else {
    List.findOne({ name: listName })
      .then(function (foundList) {
        foundList.items.push(newItem);
        foundList.save()
          .then(() => console.log("Item added."))
          .catch((err) => console.log(err));
        res.redirect(`/${listName}`);
      })
      .catch((err) => console.log(err));
  }

});

app.post("/delete", function (req, res) {
  const checkedID = req.body.checkbox;
  const listTitle = req.body.listTitle;

  if (listTitle === "Today") {
    Item.findByIdAndRemove(checkedID)
    .then(() => console.log("Deleted item."))
    .catch((err) => console.log(err));
    res.redirect("/");
  } else {
    List.findOneAndUpdate({name: listTitle}, {$pull: {items: {_id: checkedID}}})
    .then((foundList) => res.redirect(`/${listTitle}`));
  }

  
})

app.get("/work", function (req, res) {
  res.render("list", { listTitle: "Work List", newListItems: workItems });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
