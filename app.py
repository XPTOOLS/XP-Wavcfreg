import os
import pymongo
from flask import Flask, request, jsonify, Response, send_from_directory

app = Flask(__name__)

# MongoDB connection
MONGO_URI = os.environ.get('MONGO_URI', 'mongodb+srv://anonymousguywas:12345Trials@cluster0.t4nmrtp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
client = pymongo.MongoClient(MONGO_URI)
db = client['vcfdb']
contacts_col = db['contacts']
settings_col = db['settings']

@app.route('/')
def user_page():
    return send_from_directory('.', 'user.html')

@app.route('/admin')
def admin_page():
    return send_from_directory('.', 'admin.html')

@app.route('/stats')
def stats():
    total_users = contacts_col.count_documents({})
    config = settings_col.find_one({'_id': 'config'})
    target = config['target'] if config else 500
    return jsonify({'total_users': total_users, 'target': target})

@app.route('/submit', methods=['POST'])
def submit():
    data = request.json
    if not data or 'phone' not in data:
        return jsonify({'success': False, 'message': 'Phone number is required'}), 400
    
    existing_contact = contacts_col.find_one({'phone': data['phone']})
    if existing_contact:
        return jsonify({'success': False, 'message': 'This phone number is already registered'}), 400
    
    contacts_col.insert_one(data)
    return jsonify({'success': True})

@app.route('/get_contacts')
def get_contacts():
    page = request.args.get('page', default=0, type=int)
    limit = request.args.get('limit', default=10, type=int)
    skip = page * limit
    users = list(contacts_col.find({}, {'_id': 0}).skip(skip).limit(limit))
    return jsonify(users)

@app.route('/update_target', methods=['POST'])
def update_target():
    data = request.json
    settings_col.update_one(
        {'_id': 'config'},
        {'$set': {'target': data['target']}},
        upsert=True
    )
    return jsonify({'success': True})

@app.route('/get_prefix')
def get_prefix():
    config = settings_col.find_one({'_id': 'config'})
    prefix = config.get('prefix', '') if config else ''
    return jsonify({'prefix': prefix})

@app.route('/update_prefix', methods=['POST'])
def update_prefix():
    data = request.json
    settings_col.update_one(
        {'_id': 'config'},
        {'$set': {'prefix': data['prefix']}},
        upsert=True
    )
    return jsonify({'success': True})

@app.route('/generate_vcf')
def generate_vcf():
    users = list(contacts_col.find({}, {'_id': 0}))
    config = settings_col.find_one({'_id': 'config'})
    prefix = config.get('prefix', '') if config else ''
    vcf_content = ''
    for user in users:
        full_name = f"{prefix}{user.get('name', '')}" if user.get('name') else ''
        vcf_content += f"""BEGIN:VCARD\r
VERSION:3.0\r
FN:{full_name}\r
NICKNAME:{user.get('username', '')}\r
TEL:{user.get('phone', '')}\r
END:VCARD\r
"""
    resp = Response(vcf_content.encode('utf-8'), mimetype='text/vcard; charset=utf-8')
    resp.headers['Content-Disposition'] = 'attachment; filename=contacts.vcf'
    return resp

@app.route('/clear_contacts', methods=['POST'])
def clear_contacts():
    try:
        result = contacts_col.delete_many({})
        if result.deleted_count > 0:
            return jsonify({'success': True, 'message': f'Cleared {result.deleted_count} contacts!'})
        return jsonify({'success': True, 'message': 'No contacts to clear.'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error clearing contacts: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)