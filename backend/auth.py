from flask import Blueprint, request, jsonify
from flask_cors import CORS
from models import db, User
from flask_jwt_extended import create_access_token, create_refresh_token, get_jwt_identity, jwt_required

auth_bp = Blueprint("auth", __name__)
CORS(auth_bp, resources={r"/*": {"origins": "*"}})  # Enables CORS for all domains on all routes

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    if User.query.filter_by(username=data["username"]).first():
        return jsonify({"status": "error", "message": "User already exists"}), 400
    user = User(username=data["username"])
    user.set_password(data["password"])
    db.session.add(user)
    db.session.commit()
    return jsonify({"status": "success", "message": "Registered successfully"}), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data["username"]).first()
    if user and user.check_password(data["password"]):
        access_token = create_access_token(identity=user.username)
        refresh_token = create_refresh_token(identity=user.username)
        return jsonify({
            "status": "success",
            "token": access_token,
            "refresh_token": refresh_token,
            "user": user.username
        })
    return jsonify({"status": "error", "message": "Invalid credentials"}), 401

@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    current_user = get_jwt_identity()
    new_token = create_access_token(identity=current_user)
    return jsonify({"status": "success", "token": new_token})

