jQuery(document).ready(function($) {
    'use strict';
    
    let currentPage = 1;
    let itemsPerPage = 8;
    let currentSearch = '';
    let totalItems = 0;
    let totalPages = 1;
    let currentData = [];
    let activeFilters = {
        post_type: '',
        post_status: 'publish'  // Default to published posts
    };
    let currentColumnPage = 1;
    let columnsPerPage = 8;
    let editingPostId = null;
    let sortField = '';
    let sortOrder = 'asc';
    let showPostStatusColumn = true; // Toggle state for post_status column
    let showComboTitleNameColumn = true; // Toggle state for combo_title_name column
    let showPostTitleColumn = true; // Toggle state for post_title column
    let showPostNameColumn = true; // Toggle state for post_name column
    
    const allColumns = [
        {field: 'ID', label: 'id', table: 'wp_posts'},
        {field: 'post_status', label: 'post_status', table: 'wp_posts', editable: true},
        {field: 'combo_title_name', label: 'combo title name', table: 'wp_posts', special: 'combo'},
        {field: 'post_title', label: 'post_title', table: 'wp_posts', editable: true},
        {field: 'post_name', label: 'post_name', table: 'wp_posts', editable: true},
        {field: 'post_content', label: 'post_content', table: 'wp_posts', special: 'content'},
        {field: '_elementor_data', label: '_elementor_data', table: 'wp_postmeta', special: 'elementor'},
        {field: 'post_type', label: 'post_type', table: 'wp_posts', editable: true},
        {field: 'post_date', label: 'post_date', table: 'wp_posts'},
        {field: 'post_modified', label: 'post_modified', table: 'wp_posts'},
        {field: 'post_author', label: 'post_author', table: 'wp_posts', editable: true},
        {field: 'post_parent', label: 'post_parent', table: 'wp_posts', editable: true},
        {field: 'menu_order', label: 'menu_order', table: 'wp_posts', editable: true},
        {field: 'comment_status', label: 'comment_status', table: 'wp_posts', editable: true},
        {field: 'ping_status', label: 'ping_status', table: 'wp_posts', editable: true},
        {field: 'rel_wp_post_id', label: 'rel_wp_post_id', table: 'wp_zen_orbitposts'},
        {field: 'orbitpost_id', label: 'orbitpost_id', table: 'wp_zen_orbitposts'},
        {field: 'redshift_datum', label: 'redshift_datum', table: 'wp_zen_orbitposts'},
        {field: 'rover_datum', label: 'rover_datum', table: 'wp_zen_orbitposts'},
        {field: 'hudson_imgplanbatch_id', label: 'hudson_imgplanbatch_id', table: 'wp_zen_orbitposts'},
        {field: 'is_pinned', label: 'is_pinned', table: 'wp_zen_orbitposts'},
        {field: 'is_flagged', label: 'is_flagged', table: 'wp_zen_orbitposts'},
        {field: 'is_starred', label: 'is_starred', table: 'wp_zen_orbitposts'},
        {field: 'is_squared', label: 'is_squared', table: 'wp_zen_orbitposts'},
        {field: 'created_at', label: 'created_at', table: 'wp_zen_orbitposts'},
        {field: 'updated_at', label: 'updated_at', table: 'wp_zen_orbitposts'}
    ];
    
    init();
    
    function init() {
        bindEventHandlers();
        loadData();
    }
    
    function bindEventHandlers() {
        $('.klyra-rows-per-page-btn').on('click', function() {
            itemsPerPage = $(this).data('rows') === 'all' ? 999999 : parseInt($(this).data('rows'));
            $('.klyra-rows-per-page-btn').removeClass('active').css({
                'background': 'white',
                'color': '#333',
                'border-color': '#D1D5DB'
            });
            $(this).addClass('active').css({
                'background': '#3B82F6',
                'color': 'white',
                'border-color': '#3B82F6'
            });
            currentPage = 1;
            loadData();
        });
        
        $('#klyra-first-row-page').on('click', function() {
            currentPage = 1;
            loadData();
        });
        
        $('#klyra-prev-row-page').on('click', function() {
            if (currentPage > 1) {
                currentPage--;
            } else {
                // Wrap to last page (infinite/recursive behavior)
                currentPage = totalPages;
            }
            loadData();
        });
        
        $('#klyra-next-row-page').on('click', function() {
            if (currentPage < totalPages) {
                currentPage++;
            } else {
                // Wrap to first page (infinite/recursive behavior)
                currentPage = 1;
            }
            loadData();
        });
        
        $('#klyra-last-row-page').on('click', function() {
            currentPage = totalPages;
            loadData();
        });
        
        $('#klyra-search').on('input', debounce(function() {
            currentSearch = $(this).val();
            currentPage = 1;
            loadData();
        }, 500));
        
        $('.klyra-status-filter-btn').on('click', function() {
            const statusValue = $(this).data('status');
            
            // Remove active class from all status buttons
            $('.klyra-status-filter-btn').removeClass('active').css({
                'background': 'white',
                'color': '#333',
                'border-color': '#D1D5DB'
            });
            
            // Add active class to clicked button
            $(this).addClass('active').css({
                'background': '#3B82F6',
                'color': 'white',
                'border-color': '#3B82F6'
            });
            
            // Update filter
            activeFilters.post_status = statusValue === 'all' ? '' : statusValue;
            
            currentPage = 1;
            loadData();
        });
        
        $('.klyra-cols-per-page-btn').on('click', function() {
            columnsPerPage = $(this).data('cols') === 'all' ? allColumns.length : parseInt($(this).data('cols'));
            $('.klyra-cols-per-page-btn').removeClass('active').css({
                'background': 'white',
                'color': '#333'
            });
            $(this).addClass('active').css({
                'background': '#f8f782',
                'color': 'black'
            });
            currentColumnPage = 1;
            renderTable();
        });
        
        $('#klyra-first-col-page, #klyra-prev-col-page, #klyra-next-col-page, #klyra-last-col-page').on('click', function() {
            // Calculate total pages excluding wolf exclusion band columns (same as applyColumnPagination)
            let wolfBandColumnCount = 3; // checkbox, tool_buttons, id (always shown)
            if (showPostStatusColumn) wolfBandColumnCount++;
            if (showComboTitleNameColumn) wolfBandColumnCount++;
            if (showPostTitleColumn) wolfBandColumnCount++;
            if (showPostNameColumn) wolfBandColumnCount++;
            
            const totalDataCols = Math.max(0, allColumns.length - wolfBandColumnCount + 2); // +2 for checkbox and tool_buttons
            const totalColPages = Math.ceil(totalDataCols / columnsPerPage);
            const btnId = $(this).attr('id');
            
            if (btnId === 'klyra-first-col-page') {
                currentColumnPage = 1;
            } else if (btnId === 'klyra-prev-col-page') {
                if (currentColumnPage > 1) {
                    currentColumnPage--;
                } else {
                    // Wrap to last page (infinite/recursive behavior)
                    currentColumnPage = totalColPages;
                }
            } else if (btnId === 'klyra-next-col-page') {
                if (currentColumnPage < totalColPages) {
                    currentColumnPage++;
                } else {
                    // Wrap to first page (infinite/recursive behavior)
                    currentColumnPage = 1;
                }
            } else if (btnId === 'klyra-last-col-page') {
                currentColumnPage = totalColPages;
            }
            
            renderTable();
        });
        
        $('#klyra-create-post-btn').on('click', function() {
            $('#modal-post-type').val('post');
            $('#klyra-modal-title').text('Create New Post');
            $('#klyra-modal-form')[0].reset();
            $('#klyra-create-modal').addClass('active');
        });
        
        // Post Status Column Toggle Handler
        $('#post-status-toggle').on('click', function() {
            showPostStatusColumn = !showPostStatusColumn;
            
            if (showPostStatusColumn) {
                $(this).removeClass('off');
            } else {
                $(this).addClass('off');
            }
            
            renderTable();
        });
        
        // Combo Title Name Column Toggle Handler
        $('#combo-title-name-toggle').on('click', function() {
            showComboTitleNameColumn = !showComboTitleNameColumn;
            
            if (showComboTitleNameColumn) {
                $(this).removeClass('off');
            } else {
                $(this).addClass('off');
            }
            
            renderTable();
        });
        
        // Post Title Column Toggle Handler
        $('#post-title-toggle').on('click', function() {
            showPostTitleColumn = !showPostTitleColumn;
            
            if (showPostTitleColumn) {
                $(this).removeClass('off');
            } else {
                $(this).addClass('off');
            }
            
            renderTable();
        });
        
        // Post Name Column Toggle Handler
        $('#post-name-toggle').on('click', function() {
            showPostNameColumn = !showPostNameColumn;
            
            if (showPostNameColumn) {
                $(this).removeClass('off');
            } else {
                $(this).addClass('off');
            }
            
            renderTable();
        });
        
        $('#klyra-create-page-btn').on('click', function() {
            $('#modal-post-type').val('page');
            $('#klyra-modal-title').text('Create New Page');
            $('#klyra-modal-form')[0].reset();
            $('#klyra-create-modal').addClass('active');
        });
        
        $('#klyra-modal-close, #klyra-modal-cancel').on('click', function() {
            $('#klyra-create-modal').removeClass('active');
        });
        
        $('#klyra-modal-form').on('submit', function(e) {
            e.preventDefault();
            createPost();
        });
        
        $(document).on('click', '.klyra-editable-cell', function() {
            const $cell = $(this);
            const postId = $cell.data('id');
            const field = $cell.data('field');
            const currentValue = $cell.find('.cell_inner_wrapper_div').text();
            
            const $input = $('<input type="text" class="klyra-editing-input">').val(currentValue);
            $cell.find('.cell_inner_wrapper_div').html($input);
            $input.focus();
            
            $input.on('blur', function() {
                const newValue = $(this).val();
                if (newValue !== currentValue) {
                    updateField(postId, field, newValue, $cell);
                } else {
                    $cell.find('.cell_inner_wrapper_div').text(currentValue);
                }
            });
            
            $input.on('keypress', function(e) {
                if (e.which === 13) {
                    $(this).blur();
                }
            });
        });
        
        $(document).on('click', '.klyra-content-edit-btn', function(e) {
            e.stopPropagation();
            const postId = $(this).data('id');
            editingPostId = postId;
            
            const post = currentData.find(p => p.ID == postId);
            if (post) {
                $('#klyra-content-editor-textarea').val(post.post_content || '');
                $('#klyra-content-editor-modal').addClass('active');
            }
        });
        
        $('#klyra-content-editor-cancel').on('click', function() {
            $('#klyra-content-editor-modal').removeClass('active');
            editingPostId = null;
        });
        
        $('#klyra-content-editor-save').on('click', function() {
            if (editingPostId) {
                const content = $('#klyra-content-editor-textarea').val();
                updatePostContent(editingPostId, content);
            }
        });
        
        $('#klyra-select-all').on('change', function() {
            $('.klyra-row-checkbox').prop('checked', $(this).prop('checked'));
        });
        
        $('.klyra-sortable-column').on('click', function() {
            const field = $(this).data('field');
            
            if (sortField === field) {
                // Toggle sort order if clicking same column
                sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
            } else {
                // New column, default to ascending
                sortField = field;
                sortOrder = 'asc';
            }
            
            // Update sort indicators
            $('.klyra-sort-indicator').html('');
            const indicator = sortOrder === 'asc' ? ' ↑' : ' ↓';
            $(this).find('.klyra-sort-indicator').html(indicator);
            
            currentPage = 1;
            loadData();
        });
    }
    
    function loadData() {
        $.ajax({
            url: klyraBeamray.ajaxurl,
            type: 'POST',
            data: {
                action: 'klyra_get_posts_data',
                nonce: klyraBeamray.nonce,
                page: currentPage,
                per_page: itemsPerPage,
                search: currentSearch,
                post_type: activeFilters.post_type,
                post_status: activeFilters.post_status,
                sort_field: sortField,
                sort_order: sortOrder
            },
            success: function(response) {
                if (response.success) {
                    currentData = response.data.data;
                    totalItems = response.data.total;
                    totalPages = response.data.total_pages;
                    renderTable();
                    updatePaginationInfo();
                }
            },
            error: function() {
                alert('Error loading data');
            }
        });
    }
    
    function renderTable() {
        const $tbody = $('#klyra-beamray-tbody');
        $tbody.empty();
        
        if (currentData.length === 0) {
            $tbody.html('<tr><td colspan="30" class="klyra-loading">No posts or pages found.</td></tr>');
            // Apply column pagination even for empty state
            applyColumnPagination();
            return;
        }
        
        currentData.forEach(post => {
            const $tr = $('<tr></tr>').attr('data-post-id', post.ID);
            
            // Fixed columns: checkbox + tool_buttons
            $tr.append(`
                <td class="klyra-checkbox-cell for_db_table_checkbox">
                    <div class="cell_inner_wrapper_div for_db_table_checkbox">
                        <input type="checkbox" class="klyra-checkbox klyra-row-checkbox" value="${post.ID}">
                    </div>
                </td>
            `);
            
            $tr.append(`
                <td class="for_db_table_misc">
                    <div class="cell_inner_wrapper_div for_db_table_misc" style="display: flex; gap: 2px;">
                        <a href="/wp-admin/post.php?post=${post.ID}&action=edit" class="klyra-tool-btn" title="Edit">ED</a>
                        <a href="${getPermalink(post)}" class="klyra-tool-btn" title="View" target="_blank">VW</a>
                        ${post._elementor_data ? 
                          `<button class="klyra-elementor-btn" data-post-id="${post.ID}" title="Elementor">EL</button>` : 
                          `<button class="klyra-elementor-btn disabled" title="No Elementor Data">EL</button>`
                        }
                    </div>
                </td>
            `);
            
            // All data columns in order matching the header
            allColumns.forEach(col => {
                let cellValue = post[col.field] || '';
                const dbTableClass = `for_db_table_${col.table}`;
                let cellClass = dbTableClass;
                let cellAttrs = '';
                
                if (col.field === 'post_status') {
                    cellAttrs = `data-status="${cellValue}"`;
                }
                
                if (col.field === 'post_title') {
                    cellClass += ' post-title-cell';
                }
                
                if (col.editable) {
                    cellClass += ' klyra-editable-cell';
                    cellAttrs += ` data-id="${post.ID}" data-field="${col.field}"`;
                }
                
                if (col.special === 'content') {
                    const preview = stripTags(cellValue).substring(0, 50) + '...';
                    $tr.append(`
                        <td class="${cellClass}" ${cellAttrs} data-field="${col.field}">
                            <div class="cell_inner_wrapper_div ${dbTableClass}">
                                ${preview}
                                <button class="klyra-content-edit-btn" data-id="${post.ID}" style="width: 20px; height: 20px; background: #0073aa; color: white; border: none; cursor: pointer; font-size: 10px; font-weight: bold; float: right; margin-left: 8px;">ED</button>
                            </div>
                        </td>
                    `);
                } else if (col.special === 'elementor') {
                    const hasElementor = cellValue ? 'Yes' : 'No';
                    $tr.append(`<td class="${cellClass}"><div class="cell_inner_wrapper_div ${dbTableClass}">${hasElementor}</div></td>`);
                } else if (col.special === 'combo') {
                    // Combo column with post_title and post_name inputs
                    $tr.append(`
                        <td class="${cellClass}" data-field="combo_title_name" style="min-width: 250px; width: auto;">
                            <div class="cell_inner_wrapper_div ${dbTableClass}" style="min-width: 240px; padding: 4px;">
                                <input type="text" value="${post.post_title || ''}" class="klyra-editable-cell" data-id="${post.ID}" data-field="post_title" style="width: calc(100% - 8px); margin-bottom: 4px; padding: 4px; border: 1px solid #ddd; font-size: 12px; box-sizing: border-box;">
                                <input type="text" value="${post.post_name || ''}" class="klyra-editable-cell" data-id="${post.ID}" data-field="post_name" style="width: calc(100% - 8px); padding: 4px; border: 1px solid #ddd; font-size: 12px; box-sizing: border-box;">
                            </div>
                        </td>
                    `);
                } else {
                    $tr.append(`<td class="${cellClass}" ${cellAttrs}><div class="cell_inner_wrapper_div ${dbTableClass}">${cellValue}</div></td>`);
                }
            });
            
            $tbody.append($tr);
        });
        
        // Re-bind sort event handlers after table recreation
        $('.klyra-sortable-column').off('click.sort').on('click.sort', function() {
            const field = $(this).data('field');
            
            if (sortField === field) {
                // Toggle sort order if clicking same column
                sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
            } else {
                // New column, default to ascending
                sortField = field;
                sortOrder = 'asc';
            }
            
            currentPage = 1;
            loadData();
        });
        
        // Apply column pagination after table is fully built
        applyColumnPagination();
    }
    
    // Column pagination using show/hide approach with Wolf Exclusion Band
    function applyColumnPagination() {
        if (columnsPerPage !== allColumns.length) {
            // Wolf Exclusion Band: checkbox + tool_buttons + id are always shown, others are optional
            const wolfBandIndices = [0, 1, 2]; // checkbox, tool_buttons, id (always shown)
            
            // Add optional wolf band columns based on toggle state
            if (showPostStatusColumn) wolfBandIndices.push(3); // post_status
            if (showComboTitleNameColumn) wolfBandIndices.push(4); // combo_title_name
            if (showPostTitleColumn) wolfBandIndices.push(5); // post_title  
            if (showPostNameColumn) wolfBandIndices.push(6); // post_name
            
            const wolfBandCount = wolfBandIndices.length;
            
            // Calculate paginated column range (starts after wolf band)
            const startCol = wolfBandCount + (currentColumnPage - 1) * columnsPerPage;
            const endCol = startCol + columnsPerPage - 1;
            
            // Apply to each header row separately
            $('#klyra-beamray-table thead tr').each(function() {
                $(this).find('th').each(function(index) {
                    // Special handling for optional wolf band columns
                    if ((index === 3 && !showPostStatusColumn) || 
                        (index === 4 && !showComboTitleNameColumn) ||
                        (index === 5 && !showPostTitleColumn) || 
                        (index === 6 && !showPostNameColumn)) {
                        $(this).hide().removeClass('wolf-exclusion-band');
                    } else if (wolfBandIndices.includes(index)) {
                        $(this).show().addClass('wolf-exclusion-band'); // Always show wolf band columns
                    } else if (index >= startCol && index <= endCol) {
                        $(this).show().removeClass('wolf-exclusion-band');
                    } else {
                        $(this).hide().removeClass('wolf-exclusion-band');
                    }
                });
            });
            
            // Apply same logic to all data rows
            $('#klyra-beamray-table tbody tr').each(function() {
                $(this).find('td').each(function(index) {
                    // Special handling for optional wolf band columns
                    if ((index === 3 && !showPostStatusColumn) || 
                        (index === 4 && !showComboTitleNameColumn) ||
                        (index === 5 && !showPostTitleColumn) || 
                        (index === 6 && !showPostNameColumn)) {
                        $(this).hide().removeClass('wolf-exclusion-band');
                    } else if (wolfBandIndices.includes(index)) {
                        $(this).show().addClass('wolf-exclusion-band'); // Always show wolf band columns
                    } else if (index >= startCol && index <= endCol) {
                        $(this).show().removeClass('wolf-exclusion-band');
                    } else {
                        $(this).hide().removeClass('wolf-exclusion-band');
                    }
                });
            });
        } else {
            // "All" option: Show all columns but maintain wolf exclusion band
            const wolfBandIndices = [0, 1, 2]; // checkbox, tool_buttons, id (always shown)
            
            // Add optional wolf band columns based on toggle state
            if (showPostStatusColumn) wolfBandIndices.push(3); // post_status
            if (showComboTitleNameColumn) wolfBandIndices.push(4); // combo_title_name
            if (showPostTitleColumn) wolfBandIndices.push(5); // post_title  
            if (showPostNameColumn) wolfBandIndices.push(6); // post_name
            
            // Apply to each header row separately
            $('#klyra-beamray-table thead tr').each(function() {
                $(this).find('th').each(function(index) {
                    // Special handling for optional wolf band columns
                    if ((index === 3 && !showPostStatusColumn) || 
                        (index === 4 && !showComboTitleNameColumn) ||
                        (index === 5 && !showPostTitleColumn) || 
                        (index === 6 && !showPostNameColumn)) {
                        $(this).hide().removeClass('wolf-exclusion-band');
                    } else {
                        $(this).show(); // Show all columns
                        if (wolfBandIndices.includes(index)) {
                            $(this).addClass('wolf-exclusion-band'); // Maintain wolf band styling
                        } else {
                            $(this).removeClass('wolf-exclusion-band');
                        }
                    }
                });
            });
            
            // Apply same logic to all data rows
            $('#klyra-beamray-table tbody tr').each(function() {
                $(this).find('td').each(function(index) {
                    // Special handling for optional wolf band columns
                    if ((index === 3 && !showPostStatusColumn) || 
                        (index === 4 && !showComboTitleNameColumn) ||
                        (index === 5 && !showPostTitleColumn) || 
                        (index === 6 && !showPostNameColumn)) {
                        $(this).hide().removeClass('wolf-exclusion-band');
                    } else {
                        $(this).show(); // Show all columns
                        if (wolfBandIndices.includes(index)) {
                            $(this).addClass('wolf-exclusion-band'); // Maintain wolf band styling
                        } else {
                            $(this).removeClass('wolf-exclusion-band');
                        }
                    }
                });
            });
        }
        
        // Count actual columns in the table, excluding wolf exclusion band columns
        let wolfBandColumnCount = 3; // checkbox, tool_buttons, id (always shown)
        if (showPostStatusColumn) wolfBandColumnCount++;
        if (showPostTitleColumn) wolfBandColumnCount++;
        if (showPostNameColumn) wolfBandColumnCount++;
        
        const totalDataCols = Math.max(0, allColumns.length - wolfBandColumnCount + 2); // +2 for checkbox and tool_buttons
        
        // Update pagination displays
        const totalColPages = Math.ceil(totalDataCols / columnsPerPage);
        const visibleColumnCount = columnsPerPage === allColumns.length ? allColumns.length : columnsPerPage;
        
        $('#klyra-current-col-page').text(currentColumnPage);
        $('#klyra-total-col-pages').text(totalColPages);
        $('#klyra-columns-showing').text(visibleColumnCount);
    }
    
    function updatePaginationInfo() {
        const start = (currentPage - 1) * itemsPerPage + 1;
        const end = Math.min(currentPage * itemsPerPage, totalItems);
        
        $('#klyra-showing').text(end);
        $('#klyra-total').text(totalItems);
        $('#klyra-current-row-page').text(currentPage);
        $('#klyra-total-row-pages').text(totalPages);
    }
    
    function updateField(postId, field, value, $cell) {
        $.ajax({
            url: klyraBeamray.ajaxurl,
            type: 'POST',
            data: {
                action: 'klyra_update_post_field',
                nonce: klyraBeamray.nonce,
                post_id: postId,
                field: field,
                value: value
            },
            success: function(response) {
                if (response.success) {
                    $cell.find('.cell_inner_wrapper_div').text(value);
                    const post = currentData.find(p => p.ID == postId);
                    if (post) {
                        post[field] = value;
                    }
                } else {
                    alert('Error updating field: ' + response.data);
                    $cell.find('.cell_inner_wrapper_div').text(value);
                }
            },
            error: function() {
                alert('Error updating field');
            }
        });
    }
    
    function updatePostContent(postId, content) {
        $.ajax({
            url: klyraBeamray.ajaxurl,
            type: 'POST',
            data: {
                action: 'klyra_update_post_content',
                nonce: klyraBeamray.nonce,
                post_id: postId,
                content: content
            },
            success: function(response) {
                if (response.success) {
                    $('#klyra-content-editor-modal').removeClass('active');
                    editingPostId = null;
                    loadData();
                } else {
                    alert('Error updating content: ' + response.data);
                }
            },
            error: function() {
                alert('Error updating content');
            }
        });
    }
    
    function createPost() {
        const formData = {
            action: 'klyra_create_post',
            nonce: klyraBeamray.nonce,
            post_title: $('#modal-post-title').val(),
            post_content: $('#modal-post-content').val(),
            post_status: $('#modal-post-status').val(),
            post_type: $('#modal-post-type').val(),
            post_name: $('#modal-post-name').val(),
            post_parent: $('#modal-post-parent').val()
        };
        
        $.ajax({
            url: klyraBeamray.ajaxurl,
            type: 'POST',
            data: formData,
            success: function(response) {
                if (response.success) {
                    $('#klyra-create-modal').removeClass('active');
                    loadData();
                } else {
                    alert('Error creating post: ' + response.data);
                }
            },
            error: function() {
                alert('Error creating post');
            }
        });
    }
    
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    function stripTags(html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }
    
    function getPermalink(post) {
        if (post.post_name) {
            return '/' + post.post_name + '/';
        }
        return '/?p=' + post.ID;
    }
});