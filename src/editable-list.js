(function () {
	
	/**
	 * Editable List class
	 *
	 * The component accepts the following attributes:
	 *
	 *  list-item-X: a list item, where X can be anything
	 *  add-item-text: the text that prompts to add new items
	 *  allow-duplicates: allow duplicates, it can be true or false
	 *  duplicate-prompt: prompt message shown when a duplicate value is added
	 *
	 * The component exposes the following methods:
	 *
	 *  items(): returns the list of items
	 *  addItems(listItems): adds a list of new items
	 *  changeItem(index, newValue): change an item value by index
	 *  removeItem(index): remove an item by index
	 *  moveItemUp(index): move an item up by index
	 *  moveItemDown(index): move an item down by index
	 *  removeAllItems(): remove all items
	 *  unselectAllItems(): unselect all items in the list
	 *
	 * The component exposes the following events:
	 *
	 *  change(e): fires when a change in an item occurs, or a new item is
	 *             added, or an item is deleted or the order of items changes;
	 *             the property e.details provides details about the change
	 */
	class EditableList extends HTMLElement {
		
		static observedAttributes = ["add-item-text"];
		static #_duplicatePromptDefault = 'This value already exists!';
		
		/**
		 * Constructor
		 *
		 * @returns {void}
		 */
		constructor() {
			super();
		}
		
		/**
		 * Init function that renders the component
		 *
		 * @returns {void}
		 */
		#_init() {
			// attaches shadow tree and returns shadow root reference
			const shadow = this.attachShadow({ mode: 'open' });

			// creating a container for the editable-list component
			const editableListContainer = document.createElement('div');

			// get attribute values from getters
			const addItemText = this.getAttribute('add-item-text') || '';
			const listItems = this.#_initialItems();

			// adding a class to our container for the sake of clarity
			editableListContainer.classList.add('editable-list', 'defocused');

			// creating the inner HTML of the editable list element
			editableListContainer.innerHTML = `
				<style>
					:host(.disabled) {
						pointer-events: none;
					}
				
					.editable-list {
						background: #fff;
						border: 1px solid #444;
						border-radius: 4px;
						padding: 12px;
						min-width: 300px;
					}
					
					.editable-list.defocused {
						border: 1px solid silver;
					}
					
					ul {
						padding: 0;
						margin: 0;
					}
					
					li {
						height: 36px;
						padding: 0 8px;
						cursor: default;
					}
					
					.editable-list:not(.defocused) li.selected {
						background: #f8f8f8;
					}
					
					li, div > div {
						display: flex;
						align-items: center;
						justify-content: space-between;
					}
					
					.editable-list:not(.defocused) li:hover {
						background: #eee;
					}
					
					.item-wrapper {
						display: flex;
						padding-right: 8px;
						padding-left: 2px;
						align-items: baseline;
					}
					
					.toolbar {
						display: flex;
						gap: 6px;
					}
					
					li:not(.selected) .toolbar, .editable-list.defocused .toolbar {
						opacity: 0;
						pointer-events: none;
					}
					
					.toolbar button {
						position: relative;
					}
					
					.toolbar button:hover:before {
						content: ' ';
						position: absolute;
						width: 24px;
						height: 24px;
						background: rgba(0,0,0,0.1);
						left: -4px;
						top: -4px;
						border-radius: 50%;
					}
					
					.icon {
						background-color: transparent;
						border: none;
						cursor: pointer;
						font-size: 0;
						fill: #444;
						padding: 0;
					}
					
					.icon svg {
						width: 16px;
						height: 16px;
					}
					
					.new-list-item {
						margin-top: 16px;
						padding: 0 8px 0 2px;
					}

					.add-new-list-item-input, .edit-list-item-input {
						padding: 6px 8px;
						border-radius: 4px;
						border: 1px solid #bbb;
						font-size: 14px;
						font-family: inherit;
					}
					
					.editable-list.defocused .add-new-list-item-input {
						border: 1px solid transparent;
						opacity: 0.5;
					}
					
					.edit-list-item-input {
						margin-left: -8px;
					}
				</style>
				<ul class="item-list">
					${listItems.map(item => `<li>${this.#_itemHTML(item)}</li>`).join('')}
				</ul>
				<div class="new-list-item">
					<input class="add-new-list-item-input" type="text" placeholder="${addItemText}">
					<div class="toolbar">
						<button class="editable-list-add-item icon" title="Add">
							<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24" height="24" viewBox="0 0 24 24">
								<path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path>
							</svg>
						</button>
					</div>
				</div>
			`;

			// appending the container to the shadow DOM
			shadow.appendChild(editableListContainer);
		}
		
		/**
		 * Fires a change event for external scripts monitoring the component
		 *
		 * @param {object} data component change data
		 * @returns {void}
		 */
		#_changeEvent(data) {
			return new CustomEvent("change", {
				bubbles: true,
				cancelable: false,
				composed: true,
				detail: data
			});
		}
		
		/**
		 * Handler that checks if the editable list has lost focus
		 *
		 * @param {PointerEvent} e The event object
		 * @returns {void}
		 */
		#_defocusEditableList(e) {
			if (!e.composedPath().includes(this)) {
				this.shadowRoot.querySelector('.editable-list').classList.add("defocused");
			}
		}
		
		/**
		 * Handler that checks if the editable list has gained focus
		 *
		 * @param {PointerEvent} e The event object
		 * @returns {void}
		 */
		#_setFocus(e) {
			this.shadowRoot.querySelector('.editable-list').classList.remove("defocused");
		}

		/**
		 * Handler to add item to the list
		 *
		 * @param {Event} e The event object
		 * @returns {void}
		 */
		#_addListItem(e) {
			if ((e instanceof KeyboardEvent && e.key === "Enter") || !(e instanceof KeyboardEvent)) {
				const textInput = this.shadowRoot.querySelector('.add-new-list-item-input');
				if (textInput.value.trim() !== "") {
					const allowDuplicates = this.getAttribute('allow-duplicates') !== "false";
					const duplicatePrompt = this.getAttribute('duplicate-prompt') || EditableList.#_duplicatePromptDefault;
					if (!allowDuplicates) {
						if (this.#_valueExists(textInput.value, null)) {
							if (duplicatePrompt.trim() !== "") alert(duplicatePrompt);
							textInput.focus();
							return;
						}
					}
					
					this.addItems([textInput.value]);
					
					this.dispatchEvent(this.#_changeEvent({action: "add", previous: null, new: textInput.value}));
					
					this.#_itemList().lastChild.click();
					textInput.value = '';
				}
			}
		}
		
		/**
		 * Fires after the element has been attached to the DOM
		 *
		 * @param {Event} e The event object
		 * @returns {void}
		 */
		connectedCallback() {
			this.#_init();
			
			const container = this.shadowRoot.querySelector('.editable-list');
			const lis = [...this.shadowRoot.querySelectorAll('li')];
			const items = [...this.shadowRoot.querySelectorAll('.item-wrapper')];
			const buttons = {};
			buttons.up = [...this.shadowRoot.querySelectorAll('.editable-list-up-item')];
			buttons.down = [...this.shadowRoot.querySelectorAll('.editable-list-down-item')];
			buttons.remove = [...this.shadowRoot.querySelectorAll('.editable-list-remove-item')];
			const newItemWrapper = this.shadowRoot.querySelector('.new-list-item');
			const addElementInput = this.shadowRoot.querySelector('.add-new-list-item-input');
			const addElementButton = this.shadowRoot.querySelector('.editable-list-add-item');

			this.#_updateToolbars();

			document.addEventListener('click', this.#_defocusEditableList.bind(this), false);
			container.addEventListener('click', this.#_setFocus.bind(this), true);
			this.#_handleLiListeners.bind(this)(lis);
			this.#_handleItemListeners.bind(this)(items, buttons);
			newItemWrapper.addEventListener('click', this.#_cleanSelection.bind(this), true);
			addElementInput.addEventListener('keypress', this.#_addListItem.bind(this), false);
			addElementButton.addEventListener('click', this.#_addListItem.bind(this), false);
		}
		
		/**
		 * Fires after an attribute has changed
		 *
		 * @param {string} name The name of the changed attribute
		 * @param {string} oldValue The old value of the attribute
		 * @param {string} newValue The new value of the attribute
		 * @returns {void}
		 */
		attributeChangedCallback(name, oldValue, newValue) {
			if (!this.shadowRoot) return;
			if (name === 'add-item-text') {
				this.shadowRoot.querySelector('.add-new-list-item-input').setAttribute('placeholder', newValue);
			}
		}

		/**
		 * Returns the initial element items defined in attributes
		 *
		 * @returns {array}
		 */
		#_initialItems() {
			const items = [];

			[...this.attributes].forEach(attr => {
				if (attr.name.includes('list-item')) {
					items.push(attr.value);
				}
			});

			return items;
		}

		/**
		 * Generates the inner HTML of the li of each item
		 *
		 * @param {string} item the item text
		 * @returns {string} the item's HTML code
		 */
		#_itemHTML(item) {
			return `
				<div class="item-wrapper">${item}</div>
				<div class="toolbar">
					<button class="editable-list-up-item icon" title="Move up">
						<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24" height="24" viewBox="0 0 24 24">
							<path d="m5 9 1.41 1.41L11 5.83V22h2V5.83l4.59 4.59L19 9l-7-7-7 7z"></path>
						</svg>
					</button>
					<button class="editable-list-down-item icon" title="Move down">
						<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24" height="24" viewBox="0 0 24 24">
							<path d="m19 15-1.41-1.41L13 18.17V2h-2v16.17l-4.59-4.59L5 15l7 7 7-7z"></path>
						</svg>
					</button>
					<button class="editable-list-remove-item icon" title="Remove">
						<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24" height="24" viewBox="0 0 24 24">
							<path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path>
						</svg>
					</button>
				</div>
			`;
		}
		
		/**
		 * Update the toolbar buttons of all items
		 *
		 * @returns {void}
		 */
		#_updateToolbars() {
			const ups = this.shadowRoot.querySelectorAll('.editable-list-up-item');
			const downs = this.shadowRoot.querySelectorAll('.editable-list-down-item');
			const len = ups.length;
			for (let i = 0; i < len; i++) {
				ups[i].style.visibility = (i == 0 ? "hidden" : "visible");
				downs[i].style.visibility = (i == len - 1 ? "hidden" : "visible");
			}
		}
		
		/**
		 * Attaches click handlers to all items
		 *
		 * @param {array} lis a list of li elements of the items
		 * @returns {void}
		 */
		#_handleLiListeners(lis) {
			lis.forEach(element => {
				element.addEventListener('click', this.#_liSelected.bind(this), false);
			});
		}
		
		/**
		 * Attaches event handlers to the elements of each item inside the li
		 *
		 * @param {array} items a list of elements inside the item li
		 * @param {array} buttons a list of buttons inside the item li
		 * @returns {void}
		 */
		#_handleItemListeners(items, buttons) {
			const isTouch = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
			items.forEach(element => {
				element.addEventListener('dblclick', this.#_itemEdit.bind(this), false);
				if (isTouch) {
					element.addEventListener('touchend', this.#_attachDoubleTapHandler());
				}
			});
			buttons.up.forEach(element => {
				element.addEventListener('click',  this.#_moveUpListItemEvent.bind(this), false);
			});
			buttons.down.forEach(element => {
				element.addEventListener('click', this.#_moveDownListItemEvent.bind(this), false);
			});
			buttons.remove.forEach(element => {
				element.addEventListener('click', this.#_removeListItemHandler.bind(this), false);
			});
		}
		
		/**
		 * Start editing an item; an input field will appear to edit the item
		 * title
		 *
		 * @param {Event} e the caller event object
		 * @returns {void}
		 */
		#_itemEdit(e) {
			if (this._editing) return;
			this._editing = true;
			const li = this.#_getLi(e.target);
			const itemWrapper = li.querySelector('.item-wrapper');
			const inp = document.createElement('INPUT');
			inp.className = "edit-list-item-input";
			inp.value = itemWrapper.innerText;
			inp._value = itemWrapper.innerText;
			inp.addEventListener('blur', this.#_itemEditFinished.bind(this), false);
			inp.addEventListener('keypress', this.#_itemEditFinished.bind(this), false);
			itemWrapper.innerHTML = "";
			itemWrapper.appendChild(inp);
			inp.focus();
		}
		
		/**
		 * Item editing finished
		 *
		 * @param {Event} e the caller event object
		 * @returns {void}
		 */
		#_itemEditFinished(e) {
			if (!this._editing) return;
			if ((e instanceof KeyboardEvent && e.key === "Enter") || !(e instanceof KeyboardEvent)) {
				const enterPressed = e instanceof KeyboardEvent;
				e.preventDefault();
				const li = this.#_getLi(e.target);
				const itemWrapper = li.querySelector('.item-wrapper');
				const inp = li.querySelector('.item-wrapper input');
				const previousValue = inp._value;
				const result = this.#_changeItem(li, inp.value, previousValue);
				const duplicatePrompt = this.getAttribute('duplicate-prompt') || EditableList.#_duplicatePromptDefault;
				if (!result.accepted && duplicatePrompt.trim() !== "") alert(duplicatePrompt);

				if (result.differs) this.dispatchEvent(this.#_changeEvent({action: "edit", previous: previousValue, new: result.val}));
			}
		}
		
		/**
		 * Attach double-tap handler on item
		 *
		 * @returns {function} A double-tap handler
		 */
		#_attachDoubleTapHandler() {
			let lastTap = 0;
			let timeout;
			const detectDoubleTap = function(e) {
				const curTime = new Date().getTime();
				const tapLen = curTime - lastTap;
				if (tapLen < 500 && tapLen > 0) {
					e.preventDefault();
					this.#_itemEdit(e);
				}
				else {
					timeout = setTimeout(() => {
						clearTimeout(timeout);
					}, 500);
				}
				lastTap = curTime;
			};
			return detectDoubleTap.bind(this);
		}
		
		/**
		 * Attempt to change item value
		 *
		 * @param {HTMLElement} li the item to change the value
		 * @param {string} newValue the new value to set
		 * @param {string} previousValue the previous value of the item
		 * @returns {object} an object containing the change results
		 */
		#_changeItem(li, newValue, previousValue) {
			let result = {
				val: '',
				accepted: true,
				differs: false
			};
			const itemWrapper = li.querySelector('.item-wrapper');
			let val = newValue;
			if (val.trim() === "") val = previousValue;
			const allowDuplicates = this.getAttribute('allow-duplicates') !== "false";
			if (!allowDuplicates) {
				if (this.#_valueExists(val, itemWrapper)) {
					val = previousValue;
					result.accepted = false;
				}
			}
			this._editing = false;
			itemWrapper.innerHTML = val;
			result.val = val;
			result.differs = (val !== previousValue);
			
			return result;
		}

		/**
		 * Fires when an item is selected
		 *
		 * @param {Event} e the caller event object
		 * @returns {void}
		 */
		#_liSelected(e) {
			this.#_cleanSelection.bind(this)();
			const li = this.#_getLi(e.target);
			li.classList.toggle("selected", true);
		}
		
		/**
		 * Fires when an item is removed
		 *
		 * @param {Event} e the caller event object
		 * @returns {void}
		 */
		#_removeListItemHandler(e) {
			e.stopPropagation();
			const li = this.#_getLi(e.target);
			const val = this.#_decodeHtml(li.querySelector('.item-wrapper').innerHTML);
			this.#_removeListItem(li);
			
			this.dispatchEvent(this.#_changeEvent({action: "remove", previous: val, new: null}));
		}
		
		/**
		 * Fires when an item is moved up
		 *
		 * @param {Event} e the caller event object
		 * @returns {void}
		 */
		#_moveUpListItemEvent(e) {
			e.stopPropagation();
			const li = this.#_getLi(e.target);
			if (!this.#_moveUpListItem(li)) return;
			
			const val = this.#_decodeHtml(li.querySelector('.item-wrapper').innerHTML);
			this.dispatchEvent(this.#_changeEvent({action: "move", direction: "up", item: val}));
		}
		
		/**
		 * Fires when an item is moved down
		 *
		 * @param {Event} e the caller event object
		 * @returns {void}
		 */
		#_moveDownListItemEvent(e) {
			e.stopPropagation();
			const li = this.#_getLi(e.target);
			if (!this.#_moveDownListItem(li)) return;
			
			const val = this.#_decodeHtml(li.querySelector('.item-wrapper').innerHTML);
			this.dispatchEvent(this.#_changeEvent({action: "move", direction: "down", item: val}));
		}
		
		/**
		 * Unselect all items
		 *
		 * @param {Event} e the caller event object
		 * @returns {void}
		 */
		#_cleanSelection(e) {
			[...this.shadowRoot.querySelectorAll('li')].forEach(element => {
				element.classList.toggle("selected", false);
			});
		}
		
		/**
		 * Move an item up
		 *
		 * @param {HTMLElement} li the item li to move
		 * @returns {bool} true if succeeded, false otherwise
		 */
		#_moveUpListItem(li) {
			const prev = li.previousElementSibling;
			if (!prev) return false;
			li.parentNode.insertBefore(li, prev);
			this.#_updateToolbars();
			return true;
		}

		/**
		 * Move an item down
		 *
		 * @param {HTMLElement} li the item li to move
		 * @returns {bool} true if succeeded, false otherwise
		 */
		#_moveDownListItem(li) {
			const next = li.nextElementSibling;
			if (!next) return false;
			li.parentNode.insertBefore(next, li);
			this.#_updateToolbars();
			return true;
		}

		/**
		 * Removes an item
		 *
		 * @param {HTMLElement} li the item li to remove
		 * @returns {void}
		 */
		#_removeListItem(li) {
			li.remove();
			this.#_updateToolbars();
		}

		/**
		 * Get the containing element of the component items
		 *
		 * @returns {HTMLElement} the containing item
		 */
		#_itemList() {
			return this.shadowRoot.querySelector('.item-list');
		}
		
		/**
		 * Get the containing li element from an element inside it
		 *
		 * @param {HTMLElement} element an element inside the item li
		 * @returns {HTMLElement} the item li
		 */
		#_getLi(element) {
			while (element.tagName !== "LI") element = element.parentNode;
			return element;
		}
		
		/**
		 * Get the containing li element by index
		 *
		 * @param {integer} index the index of an element
		 * @returns {HTMLElement} the item li at the specified index or null
		 */
		#_getLiAtIndex(index) {
			return this.#_itemList().children[index] || null;
		}
		
		/**
		 * Check if an item value already exists
		 *
		 * @param {string} newValue the new item value
		 * @param {HTMLElement} item the item with the new value
		 * @returns {bool} true if it exists, false otherwise
		 */
		#_valueExists(newValue, item) {
			const itemWrappers = [...this.shadowRoot.querySelectorAll('li .item-wrapper')];
			let exists = false;
			for (var i = 0; i < itemWrappers.length; i++) {
				if (itemWrappers[i] !== item && itemWrappers[i].innerText === newValue) {
					exists = true;
					break;
				}
			}					
			return exists;
		}
		
		/**
		 * Decode HTML code into plain text
		 *
		 * @param {string} html the HTML code
		 * @returns {string} the decoded HTML
		 */
		#_decodeHtml(html) {
			var txt = document.createElement("textarea");
			txt.innerHTML = html;
			return txt.value;
		}
		
		/**
		 *     Public Methods
		 */

		/**
		 * Get a list of all items of the component
		 *
		 * @returns {array} the list of items
		 */
		items() {
			return [...this.shadowRoot.querySelectorAll('.item-wrapper')].map((el) => this.#_decodeHtml(el.innerHTML));
		}

		/**
		 * Add a list of items to the component
		 *
		 * @param {array} listItems an array of items
		 * @returns {void}
		 */
		addItems(listItems) {
			const lis = [];
			const items = [];
			const buttons = {
				up: [],
				down: [],
				remove: []
			};
			const allowDuplicates = this.getAttribute('allow-duplicates') !== "false";
			listItems.forEach(listItem => {
				if (allowDuplicates || !this.#_valueExists(listItem, null)) {
					const li = document.createElement('li');
					li.innerHTML = this.#_itemHTML(listItem);
					this.#_itemList().appendChild(li);
					lis.push(li);
					items.push(li.querySelector('.item-wrapper'));
					buttons.up.push(li.querySelector('.editable-list-up-item'));
					buttons.down.push(li.querySelector('.editable-list-down-item'));
					buttons.remove.push(li.querySelector('.editable-list-remove-item'));
				}
			});
			this.#_handleLiListeners.bind(this)(lis);
			this.#_handleItemListeners.bind(this)(items, buttons);
			this.#_updateToolbars();
		}
		
		/**
		 * Remove an item's value by index
		 *
		 * @param {integer} index The index of the item to change
		 * @param {string} newValue The new value of the item
		 * @returns {void}
		 */
		changeItem(index, newValue) {
			const li = this.#_getLiAtIndex(index);
			if (li === null) return;
			
			if (this._editing) return;
			this._editing = true;

			const itemWrapper = li.querySelector('.item-wrapper');
			this.#_changeItem(li, newValue, itemWrapper.innerText);
		}

		/**
		 * Remove an item by index
		 *
		 * @param {integer} index The index of the item to remove
		 * @returns {void}
		 */
		removeItem(index) {
			const li = this.#_getLiAtIndex(index);
			if (li === null) return;
			
			this.#_removeListItem(li);
		}

		/**
		 * Move an item up by index
		 *
		 * @param {integer} index The index of the item to move
		 * @returns {void}
		 */
		moveItemUp(index) {
			const li = this.#_getLiAtIndex(index);
			if (li === null) return;
			
			this.#_moveUpListItem(li);
		}

		/**
		 * Move an item down by index
		 *
		 * @param {integer} index The index of the item to move
		 * @returns {void}
		 */
		moveItemDown(index) {
			const li = this.#_getLiAtIndex(index);
			if (li === null) return;
			
			this.#_moveDownListItem(li);
		}

		/**
		 * Remove all items
		 *
		 * @returns {void}
		 */
		removeAllItems() {
			this.#_itemList().innerHTML = "";
		}
		
		/**
		 * Unselect all items
		 *
		 * @returns {void}
		 */
		unselectAllItems() {
			this.#_cleanSelection();
		}
		
	}

	// register the editable-list component
	customElements.define('editable-list', EditableList);

})();