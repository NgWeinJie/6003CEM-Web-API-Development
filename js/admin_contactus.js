$(document).ready(function () {
    $.get('/api/feedback', function (data) {
        if (Array.isArray(data)) {
            let html = '';

            data.forEach((item, index) => {
                console.log('🧪 Feedback ID:', item._id);
                html += `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${item.name}</td>
                        <td>${item.email}</td>
                        <td>${item.message}</td>
                        <td>${new Date(item.timestamp).toLocaleString()}</td>
                        <td>
                            <select class="form-control status-select" data-id="${item._id}">
                                <option value="Not Completed" ${item.status === 'Not Completed' ? 'selected' : ''}>Not Completed</option>
                                <option value="Completed" ${item.status === 'Completed' ? 'selected' : ''}>Completed</option>
                            </select>
                        </td>
                        <td>
                            <button class="btn btn-sm btn-danger" onclick="deleteFeedback('${item._id}')">Delete</button>
                        </td>
                    </tr>
                `;
            });

            $('#messagesContainer').html(html);
        } else {
            $('#messagesContainer').html('<tr><td colspan="6">No feedback found.</td></tr>');
        }
    }).fail(function () {
        $('#messagesContainer').html('<tr><td colspan="6" class="text-danger">Failed to load feedback messages.</td></tr>');
    });
});

function deleteFeedback(id) {
    if (confirm('Are you sure you want to delete this feedback?')) {
        $.ajax({
            url: `/api/feedback/${id}`,
            type: 'DELETE',
            success: function () {
                alert('Feedback deleted successfully.');
                location.reload();
            },
            error: function () {
                alert('Failed to delete feedback.');
            }
        });
    }
}

$(document).on('change', '.status-select', function () {
  const id = $(this).data('id');
  const newStatus = $(this).val();

  $.ajax({
    url: `/api/feedback/${id}/status`,
    type: 'PATCH',
    contentType: 'application/json',
    data: JSON.stringify({ status: newStatus }),
    success: function () {
      alert('Status updated successfully');
    },
    error: function () {
      alert('Failed to update status');
    }
  });
});

