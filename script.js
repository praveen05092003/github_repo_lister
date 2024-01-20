let totalRepositories = 0;
let fetchedRepositories = [];
let currentPage = 1;
let perPage = 5;

function fetchRepositories() {
  const username = $("#usernameInput").val();
  fetchUserInfo(username);

  const apiUrl = `https://api.github.com/users/${username}/repos?page=${currentPage}&per_page=${perPage}`;

  showLoadingSpinner();

  $.ajax({
    url: apiUrl,
    success: function (data, textStatus, xhr) {
      totalRepositories = window.userJson.public_repos;
      fetchedRepositories = data;
      displayRepositories(fetchedRepositories, currentPage);
      updatePagination();
    },
    error: function () {
      showError("Error fetching repositories.");
    },
  });
}

function fetchUserInfo(username) {
  const userApiUrl = `https://api.github.com/users/${username}`;

  $.ajax({
    url: userApiUrl,
    success: function (userJson) {
      window.userJson = userJson;
      displayUserInfo(userJson);
    },
    error: function () {
      showError("Error fetching user information.");
    },
  });
}

function showLoadingSpinner() {
  const repositoriesList = $("#repositoriesList");
  repositoriesList.html(`
    <div class='d-flex justify-content-center align-items-center' style='height: 200px;'>
      <div class='spinner-border text-primary' role='status'>
        <span class='visually-hidden'>Loading...</span>
      </div>
    </div>`);
}

function showError(message) {
  const repositoriesList = $("#repositoriesList");
  repositoriesList.html(`<p>${message}</p>`);
}

function displayUserInfo(userJson) {
  const userInfo = $("#userInfo");
  userInfo.empty();

  const {
    name,
    login,
    avatar_url,
    html_url,
    location,
    followers,
    following,
    public_repos,
  } = userJson;

  const userInfoHtml = `
    <div class="row mb-4">
      <div class="col-md-3">
        <img src="${avatar_url}" alt="Avatar" class="img-fluid rounded">
      </div>
      <div class="col-md-9">
        <h2>${name || login}</h2>
        <p>Location: ${location || "Not specified"}</p>
        <p>Followers: ${followers}</p>
        <p>Following: ${following}</p>
        <p>Public Repositories: ${public_repos}</p>
        <p><a href="${html_url}" target="_blank" class="btn btn-primary">View Profile</a></p>
      </div>
    </div>
  `;

  userInfo.html(userInfoHtml);
}

function displayRepositories(repositories, currentPage) {
  const repositoriesList = $("#repositoriesList");
  repositoriesList.empty();

  if (repositories.length === 0) {
    repositoriesList.html("<p>No repositories found.</p>");
    return;
  }

  const cardsPerRow = 2;
  const totalRows = Math.ceil(repositories.length / cardsPerRow);

  for (let row = 0; row < totalRows; row++) {
    const rowDiv = $("<div class='row mb-3'></div>");

    for (let col = 0; col < cardsPerRow; col++) {
      const index = row * cardsPerRow + col;
      if (index < repositories.length) {
        const repo = repositories[index];

        const repoCard = `
        <div class="col-md-6">
          <a href="${
            repo.html_url
          }" target="_blank" style="text-decoration: none;" class="card h-100 mb-3">
            <div class="card-body">
              <h5 class="card-title">${repo.name}</h5>
              <p class="card-text">${repo.description || ""}</p>
              <div class="mt-2">
                ${
                  repo.language
                    ? `<span class="badge bg-primary">${repo.language}</span>`
                    : ""
                }
                ${
                  repo.topics
                    ? repo.topics
                        .map(
                          (topic) =>
                            `<span class="badge bg-secondary">${topic}</span>`
                        )
                        .join(" ")
                    : ""
                }
              </div>
            </div>
          </a>
        </div>
      `;

        rowDiv.append(repoCard);
      }
    }

    repositoriesList.append(rowDiv);
  }
}

function searchRepositories() {
  const searchTerm = $("#searchInput").val().toLowerCase();
  const filteredRepositories = fetchedRepositories.filter((repo) =>
    repo.name.toLowerCase().includes(searchTerm)
  );
  displayRepositories(filteredRepositories, currentPage);
}

function changePerPage() {
  perPage = parseInt($("#perPageSelect").val());
  currentPage = 1;
  fetchRepositories();
}

function updatePagination() {
  const totalPages = Math.ceil(totalRepositories / perPage);
  const paginationDiv = $("#pagination");
  paginationDiv.empty();

  const maxVisiblePages = 5;
  paginationDiv.append(`
    <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
      <button class="page-link" onclick="prevPage()">Previous</button>
    </li>
  `);

  if (totalPages <= maxVisiblePages) {
    for (let i = 1; i <= totalPages; i++) {
      const pageLink = $(`
        <li class="page-item ${i === currentPage ? "active" : ""}">
          <button class="page-link" onclick="goToPage(${i})">${i}</button>
        </li>
      `);
      paginationDiv.append(pageLink);
    }
  } else {
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = endPage - maxVisiblePages + 1;
    }

    if (startPage > 1) {
      paginationDiv.append(`
        <li class="page-item">
          <button class="page-link" onclick="goToPage(1)">1</button>
        </li>
        <li class="page-item disabled">
          <span class="page-link">...</span>
        </li>
      `);
    }

    for (let i = startPage; i <= endPage; i++) {
      const pageLink = $(`
        <li class="page-item ${i === currentPage ? "active" : ""}">
          <button class="page-link" onclick="goToPage(${i})">${i}</button>
        </li>
      `);
      paginationDiv.append(pageLink);
    }

    if (endPage < totalPages) {
      paginationDiv.append(`
        <li class="page-item disabled">
          <span class="page-link">...</span>
        </li>
        <li class="page-item">
          <button class="page-link" onclick="goToPage(${totalPages})">${totalPages}</button>
        </li>
      `);
    }
  }

  paginationDiv.append(`
    <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
      <button class="page-link" onclick="nextPage()">Next</button>
    </li>
  `);
}

function prevPage() {
  if (currentPage > 1) {
    currentPage--;
    fetchRepositories();
  }
}

function nextPage() {
  const totalPages = Math.ceil(totalRepositories / perPage);
  if (currentPage < totalPages) {
    currentPage++;
    fetchRepositories();
  }
}

function goToPage(page) {
  currentPage = page;
  fetchRepositories();
}
