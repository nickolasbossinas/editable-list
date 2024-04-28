# Editable List

`editable-list` is a Javascript web component that displays a simple editable list of items. The user can edit the items, add new, delete or change their order.

## Installation

Just reference the Javascript file of the component inside the head of your HTML.

    <script src="editable-list.min.js"></script>

The file will register the web component automatically in the DOM.

You can use the element `<editable-list>` like any other HTML element in your HTML code.

## Attributes

The component accepts the following custom attributes:

*  `add-item-text`: the text that prompts to add new items.

*  `allow-duplicates`: allow duplicates, it can be `true` or `false`.

*  `duplicate-prompt`: prompt message shown when a duplicate value is added

## Initial List of Items

The component accepts an initial list of items, which can then be edited by the user.

Each item must be added as an element attribute in the form:

    list-item-X="value"

where X can be anything, e.g. the following initializes the component with two items, red and yellow colors:

    <editable-list list-item-1="red" list-item-2="yellow" />

## Examples

The following creates an editable list of colors that does not allow duplicates:

    <editable-list
        list-item-1="red"
        list-item-2="yellow"
        list-item-3="green"
        allow-duplicates="false"
        add-item-text="Add new color"
    />

## Interaction with Javascript

The component exposes certain methods and events so that it can be managed with Javascript.

### Methods

`items(): array`

    *Returns the list of items*

    **Return value**: the list of items

`addItems(listItems: array)`

    *Adds a list of new items*

`changeItem(index: integer, newValue: string)`

    *Change an item value by its index*

    **index**: the item index  
    **newValue**: the new value of the item

`removeItem(index: integer)`

    *Remove an item by index*

    **index**: the item index  

`moveItemUp(index: integer)`

    *Move an item up by index*

    **index**: the item index  

`moveItemDown(index: integer)`

    *Move an item down by index*

    **index**: the item index  

`removeAllItems()`

    *Remove all items*

`unselectAllItems()`

    *Unselect all items in the list*