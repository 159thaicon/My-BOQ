document.addEventListener('DOMContentLoaded', () => {
    // =================================================================
    // 1. DOM Element References
    // =================================================================
    const boqTableBody = document.querySelector('#boq-table tbody');
    const grandTotalSpan = document.getElementById('grand-total');

    // Input Form Elements
    const addItemBtn = document.getElementById('add-item-btn');
    const categorySelect = document.getElementById('item-category');
    const customCategoryInput = document.getElementById('custom-category');
    const calcTypeSelect = document.getElementById('calc-type');
    const calcInputsDiv = document.getElementById('calc-inputs');

    // Action Buttons
    const exportBtn = document.getElementById('export-btn');
    const printBtn = document.getElementById('print-btn');

    // =================================================================
    // 2. State Management (localStorage)
    // =================================================================
    
    // Function to save the entire table's data to localStorage
    function saveData() {
        const data = [];
        const rows = boqTableBody.querySelectorAll('tr.category-item'); // Save only item rows
        rows.forEach(row => {
            const cells = row.cells;
            const itemData = {
                category: row.dataset.category,
                description: cells[1].childNodes[0].nodeValue.trim(), // Get only text, ignore <br> and <small>
                quantity: cells[2].childNodes[0].nodeValue.trim(),
                quantityDetail: row.querySelector('small')?.innerText || '',
                unit: cells[3].innerText,
                price: cells[4].innerText,
                total: cells[5].innerText
            };
            data.push(itemData);
        });
        localStorage.setItem('boqData', JSON.stringify(data));
    }

    // Function to load data from localStorage and rebuild the table
    function loadData() {
        const savedData = localStorage.getItem('boqData');
        if (!savedData) return;

        const data = JSON.parse(savedData);
        boqTableBody.innerHTML = ''; // Clear table before loading

        data.forEach(item => {
            // Find or create category header
            let categoryHeader = boqTableBody.querySelector(`.category-header[data-category="${item.category}"]`);
            if (!categoryHeader) {
                categoryHeader = boqTableBody.insertRow();
                categoryHeader.className = 'category-header';
                categoryHeader.dataset.category = item.category;
                categoryHeader.innerHTML = `
                    <td></td><td colspan="4">${item.category}</td><td>0.00</td><td></td><td></td>
                `;
            }

            // Create item row
            const newRow = boqTableBody.insertRow();
            newRow.className = 'category-item';
            newRow.dataset.category = item.category;
            newRow.innerHTML = `
                <td></td>
                <td style="padding-left: 25px;">${item.description}</td>
                <td>${item.quantity} <br><small>${item.quantityDetail || ''}</small></td>
                <td>${item.unit}</td>
                <td>${item.price}</td>
                <td>${item.total}</td>
                <td><button class="edit-btn">แก้ไข</button></td>
                <td><button class="delete-btn">ลบ</button></td>
            `;
        });
        updateTable(); // Update totals and numbering after loading
    }
    
    // =================================================================
    // 3. Core Logic: Table and Calculation Updates
    // =================================================================

    // The main function to recalculate everything
    function updateTable() {
        let grandTotal = 0;
        const categorySubtotals = {};
        const rows = boqTableBody.querySelectorAll('tr');

        // Step 1: Calculate subtotals for each category
        rows.forEach(row => {
            if (row.classList.contains('category-item')) {
                const category = row.dataset.category;
                const itemTotal = parseFloat(row.cells[5].innerText.replace(/,/g, ''));
                if (!isNaN(itemTotal)) {
                    categorySubtotals[category] = (categorySubtotals[category] || 0) + itemTotal;
                    grandTotal += itemTotal;
                }
            }
        });

        // Step 2: Update UI with new numbers
        let itemCounter = 0;
        rows.forEach(row => {
            if (row.classList.contains('category-header')) {
                const category = row.dataset.category;
                const subtotal = categorySubtotals[category] || 0;
                row.cells[5].innerText = subtotal.toLocaleString(undefined, {minimumFractionDigits: 2});
                itemCounter = 0; // Reset counter for new category
            } else if (row.classList.contains('category-item')) {
                itemCounter++;
                row.cells[0].innerText = itemCounter;
            }
        });
        
        grandTotalSpan.textContent = grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
        saveData(); // Save state after every update
    }

    // Update the input fields based on calculation type selection
    function updateCalcInputs() {
        const selectedType = calcTypeSelect.value;
        calcInputsDiv.innerHTML = ''; // Clear old inputs
        if (selectedType === 'manual') {
            calcInputsDiv.innerHTML = '<input type="number" id="item-quantity" placeholder="ปริมาณ">';
        } else if (selectedType === 'area') {
            calcInputsDiv.innerHTML = `<input type="number" id="item-width" placeholder="กว้าง (ม.)"><input type="number" id="item-length" placeholder="ยาว (ม.)">`;
        } else if (selectedType === 'volume') {
            calcInputsDiv.innerHTML = `<input type="number" id="item-width" placeholder="กว้าง (ม.)"><input type="number" id="item-length" placeholder="ยาว (ม.)"><input type="number" id="item-height" placeholder="สูง/หนา (ม.)">`;
        }
    }

    // =================================================================
    // 4. Event Listeners
    // =================================================================

    // Event for the "Add Item" button
    addItemBtn.addEventListener('click', () => {
        const customCategory = customCategoryInput.value.trim();
        const selectedCategory = customCategory || categorySelect.value;
        const description = document.getElementById('item-description').value;
        const unit = document.getElementById('item-unit').value;
        const price = parseFloat(document.getElementById('item-price').value);
        
        let quantity = 0;
        let quantityDetail = "";

        // Calculate quantity based on selected mode
        const calcType = calcTypeSelect.value;
        if (calcType === 'manual') {
            quantity = parseFloat(document.getElementById('item-quantity').value);
            quantityDetail = quantity > 0 ? `(${quantity.toLocaleString()})` : '';
        } else if (calcType === 'area') {
            const width = parseFloat(document.getElementById('item-width').value);
            const length = parseFloat(document.getElementById('item-length').value);
            if (isNaN(width) || isNaN(length)) { alert('กรุณากรอกความกว้างและความยาว'); return; }
            quantity = width * length;
            quantityDetail = `(${width} x ${length} = ${quantity.toFixed(2)})`;
        } else if (calcType === 'volume') {
            const width = parseFloat(document.getElementById('item-width').value);
            const length = parseFloat(document.getElementById('item-length').value);
            const height = parseFloat(document.getElementById('item-height').value);
            if (isNaN(width) || isNaN(length) || isNaN(height)) { alert('กรุณากรอก กว้าง, ยาว, และสูง'); return; }
            quantity = width * length * height;
            quantityDetail = `(${width} x ${length} x ${height} = ${quantity.toFixed(2)})`;
        }
        
        if (!selectedCategory || !description || isNaN(quantity) || !unit || isNaN(price) || quantity <= 0) {
            alert('กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง');
            return;
        }

        // Find or create category header
        let categoryHeader = boqTableBody.querySelector(`.category-header[data-category="${selectedCategory}"]`);
        if (!categoryHeader) {
            categoryHeader = boqTableBody.insertRow();
            categoryHeader.className = 'category-header';
            categoryHeader.dataset.category = selectedCategory;
            categoryHeader.innerHTML = `<td></td><td colspan="4">${selectedCategory}</td><td>0.00</td><td></td><td></td>`;
        }
        
        // Add new item row
        const totalItemPrice = quantity * price;
        const newRow = boqTableBody.insertRow(Array.from(boqTableBody.children).indexOf(categoryHeader) + 1);
        newRow.className = 'category-item';
        newRow.dataset.category = selectedCategory;
        newRow.innerHTML = `
            <td></td>
            <td style="padding-left: 25px;">${description}</td>
            <td>${quantity.toLocaleString(undefined, {minimumFractionDigits: 2})} <br><small>${quantityDetail}</small></td>
            <td>${unit}</td>
            <td>${price.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
            <td>${totalItemPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
            <td><button class="edit-btn">แก้ไข</button></td>
            <td><button class="delete-btn">ลบ</button></td>
        `;

        updateTable();
        
        // Clear form fields
        document.getElementById('item-description').value = '';
        document.getElementById('item-unit').value = '';
        document.getElementById('item-price').value = '';
        customCategoryInput.value = '';
        updateCalcInputs();
        document.getElementById('item-description').focus();
    });

    // Event Delegation for the entire table body (Edit, Save, Delete)
    boqTableBody.addEventListener('click', (event) => {
        const target = event.target;
        const row = target.closest('tr');
        if (!row) return;

        // Handle Delete
        if (target.classList.contains('delete-btn')) {
            const category = row.dataset.category;
            row.remove();
            const remainingItems = boqTableBody.querySelector(`.category-item[data-category="${category}"]`);
            if (!remainingItems) {
                const headerToRemove = boqTableBody.querySelector(`.category-header[data-category="${category}"]`);
                if (headerToRemove) headerToRemove.remove();
            }
            updateTable();
        } 
        
        // Handle Edit
        else if (target.classList.contains('edit-btn')) {
            const cells = row.cells;
            const description = cells[1].childNodes[0].nodeValue.trim();
            const quantity = parseFloat(cells[2].childNodes[0].nodeValue.replace(/,/g, ''));
            const unit = cells[3].innerText;
            const price = parseFloat(cells[4].innerText.replace(/,/g, ''));
            
            row.innerHTML = `
                <td>${cells[0].innerText}</td>
                <td><input type="text" class="edit-input" value="${description}"></td>
                <td><input type="number" class="edit-input" step="any" value="${quantity}"></td>
                <td><input type="text" class="edit-input" value="${unit}"></td>
                <td><input type="number" class="edit-input" step="any" value="${price}"></td>
                <td>${cells[5].innerText}</td>
                <td><button class="save-btn">บันทึก</button></td>
                <td><button class="delete-btn">ลบ</button></td>
            `;
        } 
        
        // Handle Save
        else if (target.classList.contains('save-btn')) {
            const inputs = row.querySelectorAll('.edit-input');
            const newDescription = inputs[0].value;
            const newQuantity = parseFloat(inputs[1].value);
            const newUnit = inputs[2].value;
            const newPrice = parseFloat(inputs[3].value);

            if (!newDescription || isNaN(newQuantity) || !newUnit || isNaN(newPrice) || newQuantity <= 0) {
                alert('กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง');
                return;
            }

            const newTotal = newQuantity * newPrice;
            row.innerHTML = `
                <td>${row.cells[0].innerText}</td>
                <td style="padding-left: 25px;">${newDescription}</td>
                <td>${newQuantity.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                <td>${newUnit}</td>
                <td>${newPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                <td>${newTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                <td><button class="edit-btn">แก้ไข</button></td>
                <td><button class="delete-btn">ลบ</button></td>
            `;
            updateTable();
        }
    });

    // Listen for changes in the calculation type dropdown
    calcTypeSelect.addEventListener('change', updateCalcInputs);
    
    // Print Button
    printBtn.addEventListener('click', () => window.print());

    // Export to CSV Button
    exportBtn.addEventListener('click', () => {
        let csvContent = "data:text/csv;charset=utf-8,\uFEFFลำดับ,หมวดหมู่,รายการ,ปริมาณ,หน่วย,ราคาต่อหน่วย,ราคารวม\n";
        const rows = boqTableBody.querySelectorAll('tr');
        let currentCategory = "";

        rows.forEach(row => {
            if(row.classList.contains('category-header')){
                currentCategory = row.dataset.category.replace(/"/g, '""');
            } else if(row.classList.contains('category-item')){
                const cols = Array.from(row.cells);
                const rowData = [
                    cols[0].innerText,
                    `"${currentCategory}"`,
                    `"${cols[1].childNodes[0].nodeValue.trim().replace(/"/g, '""')}"`,
                    `"${parseFloat(cols[2].childNodes[0].nodeValue.trim().replace(/,/g, ''))}"`,
                    `"${cols[3].innerText.replace(/"/g, '""')}"`,
                    `"${parseFloat(cols[4].innerText.replace(/,/g, ''))}"`,
                    `"${parseFloat(cols[5].innerText.replace(/,/g, ''))}"`
                ].join(',');
                csvContent += rowData + "\n";
            }
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "boq_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
    
    // =================================================================
    // 5. Initialization
    // =================================================================

    // Setup Drag and Drop functionality
    new Sortable(boqTableBody, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        handle: '.category-item', // Only items are draggable
        filter: '.category-header', // Headers are not draggable
        onEnd: () => {
            updateTable(); // Recalculate and save new order
        }
    });
    
    // Initial setup on page load
    updateCalcInputs();
    loadData();
});