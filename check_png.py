from PIL import Image

def analyze(img_path):
    img = Image.open(img_path).convert("RGBA")
    data = img.getdata()
    # Check if there are semi-transparent yellow pixels
    yellow_semi = 0
    brown_opaque = 0
    for r, g, b, a in data:
        if a > 0 and a < 255:
            # check if it's yellowish
            if r > 150 and g > 150 and b < 100:
                yellow_semi += 1
    print(f"Semi-transparent yellow pixels: {yellow_semi}")

analyze("/Users/vikrammacpro/codespace/coursework/CS422/frontend/public/assets/Waving.png")
