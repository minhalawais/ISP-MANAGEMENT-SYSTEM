from werkzeug.security import generate_password_hash, check_password_hash

# Plain password
password = "password123"

# Generate hash (PBKDF2-SHA256 by default)
hashed_password = generate_password_hash(password)

print("Plain password:", password)
print("Hashed password:", hashed_password)

# ✅ Verify it later
is_valid = check_password_hash(hashed_password, password)
print("Password valid?", is_valid)
