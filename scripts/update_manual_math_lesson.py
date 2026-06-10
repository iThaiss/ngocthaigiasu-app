import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import import_math as im


LINE_LESSON_ID = "aec67a65-2c97-5614-b499-d07fab0d9037"

LINE_CONTENT_MD = r"""## 1. Một đường thẳng cần những gì?

Trong không gian Oxyz, nếu chỉ nói “có một đường thẳng” thì ta chưa biết nó nằm ở đâu. Để xác định đúng một đường thẳng, ta cần hai thông tin:

| Cần biết | Ý nghĩa |
|---|---|
| Một điểm neo $A(x_0,y_0,z_0)$ | Cho biết đường thẳng đi qua đâu |
| Một vectơ chỉ phương $\vec u=(a,b,c)$ | Cho biết đường thẳng đi theo hướng nào |

Thử nghĩ: qua một điểm $A$ có bao nhiêu đường thẳng? Câu trả lời là vô số. Vì vậy, điểm $A$ chỉ cho ta vị trí, chưa cho ta hướng.

Điểm cần chốt: **đường thẳng = một điểm thuộc đường + một vectơ chỉ phương**.

## 2. Nhìn hình để hiểu vai trò của vectơ chỉ phương

Hãy tưởng tượng ta đứng tại điểm $A(x_0,y_0,z_0)$. Nếu có một mũi tên $\vec u=(a,b,c)$ chỉ hướng, ta kẻ đường thẳng đi qua $A$ và song song với mũi tên đó.

Vectơ $\vec u$ không phải là một điểm. Nó là hướng di chuyển. Từ $A$, cứ tiến hoặc lùi theo hướng $\vec u$, ta sẽ tạo ra các điểm trên cùng một đường thẳng.

## 3. Tham số $t$ nghĩa là gì?

Tham số $t$ chỉ là “số lần đi theo hướng $\vec u$”.

| Giá trị $t$ | Ý nghĩa hình học |
|---|---|
| $t=0$ | Đứng nguyên tại điểm $A$ |
| $t=1$ | Đi từ $A$ thêm một vectơ $\vec u$ |
| $t=2$ | Đi từ $A$ thêm hai lần vectơ $\vec u$ |
| $t=-1$ | Đi ngược hướng $\vec u$ một lần |

Vì vậy, điểm bất kỳ trên đường thẳng có thể viết dưới dạng:

$$M(t)=A+t\vec u.$$

Đây là ý tưởng quan trọng nhất của phương trình tham số.

## 4. Từ hình sang phương trình tham số

Giả sử đường thẳng $d$ đi qua $A(x_0,y_0,z_0)$ và có vectơ chỉ phương $\vec u=(a,b,c)$.

Từ công thức $M(t)=A+t\vec u$, bung từng tọa độ ra ta được:

$$\begin{cases}
x=x_0+at\\
y=y_0+bt\\
z=z_0+ct
\end{cases}\quad (t\in\mathbb R).$$

Trong công thức này:

- $(x_0,y_0,z_0)$ là tọa độ điểm đường thẳng đi qua.
- $(a,b,c)$ là tọa độ vectơ chỉ phương.
- $t$ là tham số giúp điểm $M(t)$ chạy dọc trên đường thẳng.

Bẫy nhỏ: nhiều bạn học thuộc công thức nhưng không nhìn ra đâu là điểm, đâu là vectơ. Khi làm bài, hãy gạch chân hai thứ này trước.

## 5. Khi nào viết được phương trình chính tắc?

Từ phương trình tham số:

$$x=x_0+at,\quad y=y_0+bt,\quad z=z_0+ct.$$

Nếu $a,b,c$ đều khác $0$, ta rút được:

$$t=\frac{x-x_0}{a}=\frac{y-y_0}{b}=\frac{z-z_0}{c}.$$

Vậy phương trình chính tắc là:

$$\frac{x-x_0}{a}=\frac{y-y_0}{b}=\frac{z-z_0}{c}.$$

Cực kỳ quan trọng: nếu một trong $a,b,c$ bằng $0$, không được viết mẫu số bằng $0$. Khi đó giữ dạng tham số, hoặc viết riêng tọa độ cố định.

## 6. Cách làm bài nhận biết

Khi đề yêu cầu viết phương trình đường thẳng, làm theo ba bước:

| Bước | Việc cần làm |
|---|---|
| 1 | Tìm một điểm thuộc đường thẳng |
| 2 | Tìm một vectơ chỉ phương |
| 3 | Viết tham số trước, chỉ đổi sang chính tắc nếu không chia cho $0$ |

Nếu đề cho hai điểm $A,B$, vectơ chỉ phương tự nhiên là:

$$\vec{AB}=(x_B-x_A,\ y_B-y_A,\ z_B-z_A).$$

## 7. Ví dụ mẫu có dẫn dắt

**Ví dụ 1.** Viết phương trình đường thẳng qua $A(1,-2,3)$ và có $\vec u=(2,1,-4)$.

Ta đã có đủ hai thứ: điểm neo $A(1,-2,3)$ và hướng $\vec u=(2,1,-4)$. Vì vậy dùng ngay phương trình tham số:

$$\begin{cases}
x=1+2t\\
y=-2+t\\
z=3-4t
\end{cases}\quad (t\in\mathbb R).$$

Vì $2,1,-4$ đều khác $0$, viết được chính tắc:

$$\frac{x-1}{2}=\frac{y+2}{1}=\frac{z-3}{-4}.$$

**Ví dụ 2.** Đường thẳng qua $A(2,1,-1)$ và $B(5,7,3)$.

Đề chưa cho vectơ chỉ phương, nhưng cho hai điểm. Ta lấy:

$$\vec{AB}=(5-2,\ 7-1,\ 3-(-1))=(3,6,4).$$

Phương trình tham số qua $A$ là:

$$\begin{cases}
x=2+3t\\
y=1+6t\\
z=-1+4t
\end{cases}\quad (t\in\mathbb R).$$

**Ví dụ 3.** Đường thẳng qua $M(3,-1,2)$, có $\vec u=(0,5,-2)$.

Thành phần đầu của vectơ chỉ phương bằng $0$, nên hoành độ không đổi:

$$\begin{cases}
x=3\\
y=-1+5t\\
z=2-2t
\end{cases}\quad (t\in\mathbb R).$$

Không viết $\frac{x-3}{0}=\frac{y+1}{5}=\frac{z-2}{-2}$ vì không được chia cho $0$.

## 8. Bẫy hay gặp

- Nhầm điểm với vectơ: $A(1,-2,3)$ là nơi đường thẳng đi qua; $\vec u=(2,1,-4)$ là hướng đi.
- Quên dấu khi thay tọa độ: nếu $y_0=-2$ thì $y-y_0=y+2$, không phải $y-2$.
- Chia cho $0$: phương trình chính tắc chỉ viết đủ ba phân thức khi $a,b,c$ đều khác $0$.
- Tưởng vectơ chỉ phương là duy nhất: $(2,1,-4)$ và $(-2,-1,4)$ cùng phương, đều dùng được.

## 9. Chốt bài trong 30 giây

- Muốn viết đường thẳng, tìm **một điểm** và **một vectơ chỉ phương**.
- Phương trình tham số là cách viết an toàn nhất.
- Phương trình chính tắc chỉ viết khi không chia cho $0$.
- Nếu đường thẳng qua hai điểm $A,B$, vectơ chỉ phương tự nhiên là $\vec{AB}$.
"""

LINE_KEY_RULES = [
    "Đường thẳng trong Oxyz cần một điểm thuộc đường và một vectơ chỉ phương khác vectơ không.",
    "Phương trình tham số xuất phát từ ý tưởng $M(t)=A+t\\vec u$.",
    "Qua hai điểm $A,B$ thì có thể lấy vectơ chỉ phương là $\\vec{AB}$.",
    "Chỉ viết phương trình chính tắc khi các thành phần của vectơ chỉ phương ở mẫu đều khác $0$.",
]

LINE_COMMON_MISTAKES = [
    "Sai: dùng tọa độ vectơ chỉ phương như một điểm đi qua đường thẳng -> Đúng: tách rõ điểm neo và vectơ hướng.",
    "Sai: viết phân thức có mẫu $0$ trong phương trình chính tắc -> Đúng: dùng phương trình tham số hoặc viết tọa độ cố định.",
    "Sai: nếu $y_0=-2$ thì viết $y-2$ -> Đúng: $y-y_0=y+2$.",
    "Sai: nghĩ vectơ chỉ phương là duy nhất -> Đúng: mọi vectơ khác $0$ cùng phương đều dùng được.",
]


def main() -> int:
    if not im.SUPABASE_URL or not im.SUPABASE_KEY:
        print("Missing Supabase config.")
        return 1
    sb = im.SupabaseREST(im.SUPABASE_URL, im.SUPABASE_KEY)
    sb.update(
        "math_lessons",
        {
            "content_md": LINE_CONTENT_MD,
            "key_rules": LINE_KEY_RULES,
            "common_mistakes": LINE_COMMON_MISTAKES,
        },
        "id",
        LINE_LESSON_ID,
    )
    print(json.dumps({"updated": LINE_LESSON_ID, "content_chars": len(LINE_CONTENT_MD)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
