
project_name: "admin-extensions"

application: oidc-manager {
  label: "OIDC Manager"
  file: "bundle.js"
  # url: "https://localhost:3000/bundle.js"
  mount_points: {
    dashboard_vis: yes
    dashboard_tile: yes
    standalone: yes
  }
  entitlements: {
    use_downloads: yes
    local_storage: yes
    use_form_submit: no
    new_window: yes
    core_api_methods: ["oidc_config","update_oidc_config","create_oidc_test_config"]
    external_api_urls: ["http://localhost:5000","http://localhost:3000"]
  }
}
