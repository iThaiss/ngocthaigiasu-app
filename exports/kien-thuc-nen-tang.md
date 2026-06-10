# Kiến thức nền tảng

- Slug: `nen-tang`
- Xuất lúc: 2026-06-07 16:03:08
- Tổng số chương có dữ liệu: 8
- Tổng số bài: 47

> File này xuất từ dữ liệu `math_lessons` đang được website dùng cho khóa học.

## Chương 1: Kiến thức tiền đề

- Môn: `toan_dai`
- Số bài: 5

### 1. Giới hạn dãy số và hàm số

- ID: `d134563f-2c3b-5664-9099-7481e85bbb21`
- Chủ đề: Kiến thức tiền đề
- Mức độ: `nhan_biet`
- Số bài tập: 10

## I. Công thức & định nghĩa cốt lõi

**1. Giới hạn dãy số:**

- Nếu $|q| < 1$ thì $\lim q^n = 0$
- Nếu $q > 1$ thì $\lim q^n = +\infty$
- $\lim \frac{1}{n^k} = 0$ với $k > 0$
- $\lim c = c$ (hằng số)

**2. Giới hạn hàm số:**

- $\lim_{x \to x_0} f(x) = L$ nếu khi $x$ tiến đến $x_0$ thì $f(x)$ tiến đến $L$
- $\lim_{x \to +\infty} \frac{1}{x^k} = 0$ với $k > 0$
- $\lim_{x \to x_0} [f(x) \pm g(x)] = \lim_{x \to x_0} f(x) \pm \lim_{x \to x_0} g(x)$

**3. Giới hạn một bên:**

- $\lim_{x \to x_0^+} f(x)$: giới hạn bên phải
- $\lim_{x \to x_0^-} f(x)$: giới hạn bên trái

## II. Phương pháp làm nhanh

**Dạng 1: Nhận biết giới hạn dãy số**

- Dãy có dạng $\frac{a}{n^k}$: giới hạn bằng $0$
- Dãy có dạng $q^n$ với $|q| < 1$: giới hạn bằng $0$
- Dãy có dạng $an + b$: giới hạn là $\pm\infty$ (tùy dấu $a$)

**Dạng 2: Nhận biết giới hạn hàm số tại một điểm**

- Nếu $f(x)$ liên tục tại $x_0$ thì $\lim_{x \to x_0} f(x) = f(x_0)$
- Thay trực tiếp $x = x_0$ vào hàm số nếu không có dạng vô định

**Dạng 3: Nhận biết giới hạn vô cực**

- Phân thức: so sánh bậc tử và mẫu
  + Bậc tử < bậc mẫu: giới hạn bằng $0$
  + Bậc tử = bậc mẫu: giới hạn bằng tỉ số hệ số cao nhất
  + Bậc tử > bậc mẫu: giới hạn là $\pm\infty$

## III. Ví dụ minh họa

**Ví dụ 1:** Tính $\lim \frac{3n + 1}{2n - 5}$

*Giải:* Bậc tử = bậc mẫu = 1, nên $\lim \frac{3n + 1}{2n - 5} = \frac{3}{2}$

**Ví dụ 2:** Tính $\lim_{x \to 2} (x^2 + 3x - 1)$

*Giải:* Hàm đa thức liên tục, thay $x = 2$: $\lim_{x \to 2} (x^2 + 3x - 1) = 4 + 6 - 1 = 9$

**Ví dụ 3:** Tính $\lim_{x \to +\infty} \frac{2x + 1}{x^2 + 3}$

*Giải:* Bậc tử (1) < bậc mẫu (2), nên $\lim_{x \to +\infty} \frac{2x + 1}{x^2 + 3} = 0$

## IV. Chú ý tránh sai

- **Nhận biết dạng vô định:** Không thay trực tiếp khi có dạng $\frac{0}{0}$, $\frac{\infty}{\infty}$, $\infty - \infty$
- **Phân biệt $+\infty$ và $-\infty$:** Chú ý dấu khi tính giới hạn vô cực
- **Giới hạn một bên:** $\lim_{x \to x_0} f(x)$ tồn tại khi và chỉ khi $\lim_{x \to x_0^+} f(x) = \lim_{x \to x_0^-} f(x)$
- **So sánh bậc:** Chỉ áp dụng cho phân thức hữu tỉ khi $x \to \infty$

#### Quy tắc chính

- $\lim q^n = 0$ khi $|q| < 1$; $\lim \frac{1}{n^k} = 0$ với $k > 0$
- Hàm liên tục tại $x_0$: $\lim_{x \to x_0} f(x) = f(x_0)$
- Giới hạn phân thức tại vô cực: so sánh bậc tử và mẫu
- Bậc tử < bậc mẫu → giới hạn = 0; bậc tử = bậc mẫu → giới hạn = tỉ số hệ số
- Giới hạn một bên: $\lim_{x \to x_0^+}$ (bên phải), $\lim_{x \to x_0^-}$ (bên trái)

#### Lỗi thường gặp

- Sai: Thay trực tiếp khi gặp dạng $\frac{0}{0}$ → Đúng: Nhận biết dạng vô định, cần biến đổi
- Sai: $\lim \frac{n^2}{2n^2 + 1} = \frac{1}{2}$ (quên hệ số) → Đúng: $= \frac{1}{2}$ (hệ số tử là 1, mẫu là 2)
- Sai: Nhầm $\lim 2^n = 0$ → Đúng: $\lim 2^n = +\infty$ (vì $2 > 1$)
- Sai: Kết luận giới hạn tồn tại khi chỉ tính một bên → Đúng: Phải kiểm tra cả hai giới hạn một bên bằng nhau

---

### 2. Tính liên tục của hàm số

- ID: `cb378864-5a4d-5ce9-b5cf-0e5f295c5380`
- Chủ đề: Kiến thức tiền đề
- Mức độ: `nhan_biet`
- Số bài tập: 10

## I. Công thức & định nghĩa cốt lõi

**Định nghĩa 1: Hàm số liên tục tại một điểm**

Hàm số $y = f(x)$ liên tục tại điểm $x_0$ khi thỏa mãn **3 điều kiện**:

1. Hàm số xác định tại $x_0$ (tức $f(x_0)$ tồn tại)
2. Tồn tại giới hạn $\lim_{x \to x_0} f(x)$
3. $\lim_{x \to x_0} f(x) = f(x_0)$

**Định nghĩa 2: Hàm số liên tục trên một khoảng**

- Hàm số liên tục trên khoảng $(a;b)$ nếu nó liên tục tại mọi điểm thuộc khoảng đó
- Hàm số liên tục trên đoạn $[a;b]$ nếu:
  - Liên tục trên $(a;b)$
  - $\lim_{x \to a^+} f(x) = f(a)$ (liên tục phải tại $a$)
  - $\lim_{x \to b^-} f(x) = f(b)$ (liên tục trái tại $b$)

**Các hàm số liên tục cơ bản:**
- Hàm đa thức liên tục trên $\mathbb{R}$
- Hàm phân thức hữu tỉ liên tục trên từng khoảng xác định
- Hàm lượng giác, mũ, logarit liên tục trên từng khoảng xác định

## II. Phương pháp làm nhanh

**Bước 1:** Kiểm tra hàm số có xác định tại $x_0$ không?
- Nếu không → hàm số **không liên tục** tại $x_0$

**Bước 2:** Tính $f(x_0)$

**Bước 3:** Tính giới hạn $\lim_{x \to x_0} f(x)$
- Với hàm phân thức: rút gọn nếu dạng $\frac{0}{0}$
- Với hàm chứa căn: nhân liên hợp
- Với hàm từng khúc: tính giới hạn trái và phải

**Bước 4:** So sánh $\lim_{x \to x_0} f(x)$ với $f(x_0)$
- Nếu bằng nhau → **liên tục**
- Nếu khác nhau hoặc giới hạn không tồn tại → **không liên tục**

## III. Ví dụ minh họa

**Ví dụ 1:** Xét tính liên tục của hàm số $f(x) = \begin{cases} \frac{x^2-4}{x-2} & \text{khi } x \neq 2 \\ 4 & \text{khi } x = 2 \end{cases}$ tại $x_0 = 2$

*Giải:*
- $f(2) = 4$ (hàm số xác định tại $x = 2$)
- $\lim_{x \to 2} f(x) = \lim_{x \to 2} \frac{x^2-4}{x-2} = \lim_{x \to 2} \frac{(x-2)(x+2)}{x-2} = \lim_{x \to 2} (x+2) = 4$
- Vì $\lim_{x \to 2} f(x) = 4 = f(2)$ nên hàm số **liên tục** tại $x = 2$

**Ví dụ 2:** Hàm số $f(x) = \frac{1}{x-1}$ liên tục trên các khoảng $(-\infty; 1)$ và $(1; +\infty)$ vì đây là hàm phân thức và không xác định tại $x = 1$.

## IV. Chú ý tránh sai

- **Chú ý 1:** Không nhầm lẫn giữa "hàm số xác định tại $x_0$" và "hàm số liên tục tại $x_0$". Hàm số có thể xác định tại $x_0$ nhưng vẫn gián đoạn tại đó.

- **Chú ý 2:** Với hàm từng khúc, phải tính cả giới hạn trái và giới hạn phải tại điểm nối. Chỉ khi $\lim_{x \to x_0^-} f(x) = \lim_{x \to x_0^+} f(x) = f(x_0)$ thì hàm số mới liên tục.

- **Chú ý 3:** Khi rút gọn phân thức dạng $\frac{0}{0}$, chỉ được rút gọn khi $x \neq x_0$ (trong quá trình tính giới hạn).

#### Quy tắc chính

- Hàm số liên tục tại $x_0$ khi: $f(x_0)$ xác định, $\lim_{x \to x_0} f(x)$ tồn tại và $\lim_{x \to x_0} f(x) = f(x_0)$
- Hàm đa thức liên tục trên $\mathbb{R}$, hàm phân thức liên tục trên từng khoảng xác định
- Với hàm từng khúc tại $x_0$: kiểm tra $\lim_{x \to x_0^-} f(x) = \lim_{x \to x_0^+} f(x) = f(x_0)$
- Hàm số liên tục trên đoạn $[a;b]$ phải liên tục phải tại $a$ và liên tục trái tại $b$

#### Lỗi thường gặp

- Sai: Hàm số xác định tại $x_0$ thì liên tục tại $x_0$ → Đúng: Phải kiểm tra cả 3 điều kiện của định nghĩa
- Sai: Tính $\lim_{x \to x_0} f(x)$ bằng cách thay trực tiếp $x = x_0$ vào biểu thức chứa $\frac{0}{0}$ → Đúng: Phải rút gọn hoặc biến đổi trước khi tính giới hạn
- Sai: Với hàm từng khúc, chỉ tính một giới hạn một phía → Đúng: Phải tính cả giới hạn trái và phải, rồi so sánh với $f(x_0)$
- Sai: Kết luận hàm số gián đoạn khi chưa tính giới hạn → Đúng: Phải tính đầy đủ giới hạn và so sánh với giá trị hàm số

---

### 3. Quy tắc tính đạo hàm, đạo hàm hàm hợp và cấp hai

- ID: `99f843ed-c4ac-542a-a8d9-524ead617a1d`
- Chủ đề: Kiến thức tiền đề
- Mức độ: `nhan_biet`
- Số bài tập: 10

## I. Công thức & định nghĩa cốt lõi

**1. Đạo hàm các hàm cơ bản:**
- $(c)' = 0$ với $c$ là hằng số
- $(x^n)' = nx^{n-1}$
- $(\sqrt{x})' = \frac{1}{2\sqrt{x}}$
- $(\sin x)' = \cos x$; $(\cos x)' = -\sin x$
- $(e^x)' = e^x$; $(\ln x)' = \frac{1}{x}$

**2. Quy tắc tính đạo hàm:**
- $(u \pm v)' = u' \pm v'$
- $(uv)' = u'v + uv'$
- $\left(\frac{u}{v}\right)' = \frac{u'v - uv'}{v^2}$ với $v \neq 0$
- $(ku)' = ku'$ với $k$ là hằng số

**3. Đạo hàm hàm hợp:**
Nếu $y = f(u)$ và $u = g(x)$ thì $y'_x = y'_u \cdot u'_x$

Công thức tổng quát: $[f(u(x))]' = f'(u) \cdot u'(x)$

**4. Đạo hàm cấp hai:**
$y'' = (y')'$ - đạo hàm của đạo hàm cấp một

## II. Phương pháp làm nhanh

**Bước 1:** Nhận dạng dạng hàm số (tổng, hiệu, tích, thương, hàm hợp)

**Bước 2:** Áp dụng quy tắc tương ứng:
- Hàm hợp: Đạo hàm ngoài nhân đạo hàm trong
- Hàm tích: "Đạo hàm thứ nhất nhân thứ hai cộng thứ nhất nhân đạo hàm thứ hai"
- Hàm thương: "Đạo hàm trên nhân dưới trừ trên nhân đạo hàm dưới, chia mẫu bình phương"

**Bước 3:** Rút gọn kết quả nếu cần

**Mẹo:** Với hàm hợp nhiều lớp, tính từ ngoài vào trong như "bóc vỏ hành"

## III. Ví dụ minh họa

**Ví dụ 1:** Tính đạo hàm $y = 3x^4 - 2x^2 + 5$

$y' = 12x^3 - 4x + 0 = 12x^3 - 4x$

**Ví dụ 2:** Tính đạo hàm $y = (2x + 1)^3$ (hàm hợp)

Đặt $u = 2x + 1 \Rightarrow y = u^3$

$y' = 3u^2 \cdot u' = 3(2x+1)^2 \cdot 2 = 6(2x+1)^2$

**Ví dụ 3:** Tính đạo hàm $y = x^2\sin x$ (tích)

$y' = (x^2)'\sin x + x^2(\sin x)' = 2x\sin x + x^2\cos x$

**Ví dụ 4:** Tính đạo hàm cấp hai của $y = x^3 - 3x$

$y' = 3x^2 - 3$

$y'' = (y')' = 6x$

## IV. Chú ý tránh sai

- **Hàm hợp:** Không quên nhân với đạo hàm của hàm trong. Ví dụ: $(2x+1)^3$ có $u' = 2$ chứ không phải $1$

- **Quy tắc tích:** Không nhầm thành $(uv)' = u'v'$. Phải nhớ công thức đúng: $u'v + uv'$

- **Đạo hàm hằng số:** Đạo hàm của hằng số luôn bằng $0$, kể cả hằng số âm

- **Dấu ngoặc:** Khi rút gọn cần chú ý phân phối dấu và nhóm hạng tử đúng cách để tránh sai sót

#### Quy tắc chính

- Đạo hàm tổng/hiệu: $(u \pm v)' = u' \pm v'$
- Đạo hàm tích: $(uv)' = u'v + uv'$
- Đạo hàm thương: $\left(\frac{u}{v}\right)' = \frac{u'v - uv'}{v^2}$
- Đạo hàm hàm hợp: $[f(u(x))]' = f'(u) \cdot u'(x)$ - nhân đạo hàm ngoài với đạo hàm trong
- Đạo hàm cấp hai: $y'' = (y')'$ - lấy đạo hàm của kết quả đạo hàm cấp một

#### Lỗi thường gặp

- Sai: $(2x+3)^5$ có $y' = 5(2x+3)^4$ (quên nhân đạo hàm trong) -> Đúng: $y' = 5(2x+3)^4 \cdot 2 = 10(2x+3)^4$
- Sai: $(uv)' = u'v'$ -> Đúng: $(uv)' = u'v + uv'$ (quy tắc Leibniz)
- Sai: $(x^2 + 5)' = 2x + 5$ (đạo hàm hằng số khác 0) -> Đúng: $(x^2 + 5)' = 2x + 0 = 2x$
- Sai: $\left(\frac{x}{x+1}\right)' = \frac{1}{1}$ (áp dụng sai quy tắc thương) -> Đúng: $\left(\frac{x}{x+1}\right)' = \frac{1(x+1) - x \cdot 1}{(x+1)^2} = \frac{1}{(x+1)^2}$

---

### 4. Ý nghĩa tiếp tuyến và ý nghĩa vật lý của đạo hàm

- ID: `1904f468-1fbc-52d3-8db8-f7636bb3078b`
- Chủ đề: Kiến thức tiền đề
- Mức độ: `thong_hieu`
- Số bài tập: 10

## I. Công thức & định nghĩa cốt lõi

### 1. Ý nghĩa hình học - Tiếp tuyến

Cho hàm số $y = f(x)$ có đạo hàm tại $x_0$.

**Hệ số góc tiếp tuyến:** $k = f'(x_0)$

**Phương trình tiếp tuyến** tại điểm $M_0(x_0; y_0)$ với $y_0 = f(x_0)$:
$$y - y_0 = f'(x_0)(x - x_0)$$

**Góc tạo bởi tiếp tuyến và trục $Ox$:** $\tan\alpha = f'(x_0)$

### 2. Ý nghĩa vật lý - Vận tốc tức thời

Cho chuyển động thẳng với phương trình $s = s(t)$ (quãng đường theo thời gian).

**Vận tốc tức thời** tại thời điểm $t_0$:
$$v(t_0) = s'(t_0)$$

**Gia tốc tức thời** tại thời điểm $t_0$:
$$a(t_0) = v'(t_0) = s''(t_0)$$

## II. Phương pháp làm nhanh

### Bài toán tiếp tuyến

**Bước 1:** Tính đạo hàm $f'(x)$

**Bước 2:** Tính $f'(x_0)$ để có hệ số góc $k$

**Bước 3:** Tính $y_0 = f(x_0)$

**Bước 4:** Viết phương trình: $y = f'(x_0)(x - x_0) + y_0$

**Lưu ý:** Nếu tiếp tuyến đi qua điểm $A(x_A; y_A)$ cho trước thì thay tọa độ $A$ vào phương trình tiếp tuyến để tìm $x_0$.

### Bài toán vận tốc

**Bước 1:** Xác định phương trình chuyển động $s(t)$

**Bước 2:** Tính $v(t) = s'(t)$

**Bước 3:** Thay $t = t_0$ vào $v(t)$ để tìm vận tốc tức thời

**Bước 4:** Nếu cần gia tốc: $a(t) = v'(t) = s''(t)$

## III. Ví dụ minh họa

**Ví dụ 1:** Viết phương trình tiếp tuyến của đồ thị hàm số $y = x^3 - 3x + 1$ tại điểm có hoành độ $x_0 = 1$.

*Giải:*
- $y' = 3x^2 - 3$
- Tại $x_0 = 1$: $y'(1) = 3(1)^2 - 3 = 0$ (hệ số góc)
- $y_0 = 1^3 - 3(1) + 1 = -1$
- Phương trình tiếp tuyến: $y - (-1) = 0(x - 1)$ hay $y = -1$

**Ví dụ 2:** Một chất điểm chuyển động theo phương trình $s(t) = t^3 - 6t^2 + 9t$ (m, s). Tính vận tốc tức thời tại $t = 2$ giây.

*Giải:*
- $v(t) = s'(t) = 3t^2 - 12t + 9$
- Tại $t = 2$: $v(2) = 3(2)^2 - 12(2) + 9 = 12 - 24 + 9 = -3$ (m/s)
- Vận tốc là $-3$ m/s (chuyển động ngược chiều dương)

## IV. Chú ý tránh sai

- **Tiếp tuyến song song $Ox$:** Khi $f'(x_0) = 0$, tiếp tuyến có dạng $y = y_0$ (không phải $x = x_0$)

- **Tiếp tuyến vuông góc $Ox$:** Khi $f'(x_0)$ không xác định, tiếp tuyến có dạng $x = x_0$

- **Vận tốc âm:** Không có nghĩa là "không hợp lý" mà chỉ ra chuyển động ngược chiều dương

- **Phân biệt:** Vận tốc trung bình $v_{tb} = \frac{\Delta s}{\Delta t}$ khác vận tốc tức thời $v(t_0) = s'(t_0)$

#### Quy tắc chính

- Hệ số góc tiếp tuyến tại $x_0$ chính là $f'(x_0)$
- Phương trình tiếp tuyến: $y - y_0 = f'(x_0)(x - x_0)$ với $y_0 = f(x_0)$
- Vận tốc tức thời: $v(t) = s'(t)$, gia tốc: $a(t) = v'(t) = s''(t)$
- Tiếp tuyến song song $Ox$ khi $f'(x_0) = 0$, có dạng $y = y_0$
- Vận tốc âm nghĩa là chuyển động ngược chiều dương đã chọn

#### Lỗi thường gặp

- Sai: Viết tiếp tuyến song song $Ox$ là $x = x_0$ -> Đúng: $y = y_0$ (vì hệ số góc bằng 0)
- Sai: Quên tính $y_0 = f(x_0)$ khi viết phương trình tiếp tuyến -> Đúng: Luôn tính cả $x_0$ và $y_0$
- Sai: Nhầm vận tốc trung bình với vận tốc tức thời -> Đúng: Vận tốc tức thời là đạo hàm $v(t) = s'(t)$
- Sai: Cho rằng vận tốc âm là vô lý -> Đúng: Vận tốc âm có nghĩa chuyển động ngược chiều dương

---

### 5. Góc và khoảng cách cổ điển trong không gian

- ID: `1602de95-963f-5057-bdc6-229b93056191`
- Chủ đề: Kiến thức tiền đề
- Mức độ: `thong_hieu`
- Số bài tập: 10

## I. Công thức & định nghĩa cốt lõi

Trong hình học không gian, hai nhóm kiến thức thường gặp nhất là **góc** và **khoảng cách**. Muốn làm nhanh, trước hết cần nhận diện đúng đối tượng.

**1. Góc giữa hai đường thẳng:** Nếu hai đường thẳng $a,b$ chéo nhau, ta lấy $a' \parallel a$, $b' \parallel b$ và $a',b'$ cắt nhau. Khi đó góc giữa $a,b$ là góc nhọn hoặc vuông giữa $a',b'$. Kí hiệu: $\angle(a,b)$.

**2. Góc giữa đường thẳng và mặt phẳng:** Góc giữa đường thẳng $d$ và mặt phẳng $(P)$ là góc giữa $d$ và hình chiếu vuông góc của $d$ lên $(P)$. Nếu $d \perp (P)$ thì góc bằng $90^\circ$; nếu $d \parallel (P)$ thì góc bằng $0^\circ$.

**3. Góc giữa hai mặt phẳng:** Góc giữa hai mặt phẳng $(P)$ và $(Q)$ là góc giữa hai đường thẳng cùng vuông góc với giao tuyến của chúng, mỗi đường nằm trong một mặt phẳng. Nếu $(P) \cap (Q)=d$, chọn $a \subset (P)$, $b \subset (Q)$ sao cho $a \perp d$, $b \perp d$, khi đó $\angle((P),(Q))=\angle(a,b)$.

**4. Khoảng cách từ điểm đến mặt phẳng:** $d(A,(P))=AH$, với $H$ là hình chiếu vuông góc của $A$ lên $(P)$.

**5. Khoảng cách giữa hai đường thẳng chéo nhau:** Là độ dài đoạn vuông góc chung, tức đoạn $MN$ với $M \in a$, $N \in b$ và $MN \perp a$, $MN \perp b$.

Các định lý cổ điển quan trọng: nếu $a \perp (P)$ thì $a$ vuông góc với mọi đường thẳng nằm trong $(P)$. Ngược lại, nếu $a$ vuông góc với hai đường thẳng cắt nhau nằm trong $(P)$ thì $a \perp (P)$. Nếu hai mặt phẳng vuông góc, đường thẳng nằm trong mặt phẳng này và vuông góc với giao tuyến thì vuông góc với mặt phẳng kia.

## II. Phương pháp làm nhanh

Bước 1: Xác định đúng loại bài: góc đường-thẳng, góc đường-mặt, góc mặt-mặt, khoảng cách điểm-mặt hay khoảng cách hai đường chéo nhau.

Bước 2: Dựng hình chiếu hoặc đường phụ. Với góc giữa đường và mặt, hãy tìm hình chiếu của đường thẳng lên mặt phẳng. Với góc giữa hai mặt phẳng, hãy tìm giao tuyến rồi dựng hai đường cùng vuông góc giao tuyến.

Bước 3: Đưa bài toán không gian về tam giác phẳng. Hầu hết kết quả cuối cùng được tính bằng hệ thức lượng: định lý Pythagore, hệ thức lượng trong tam giác vuông, định lý cosin.

Bước 4: Ưu tiên tìm tam giác vuông chứa đại lượng cần tính. Nếu cần góc $\alpha$, thường dùng
$$\sin \alpha=\frac{\text{đối}}{\text{huyền}},\quad \cos \alpha=\frac{\text{kề}}{\text{huyền}},\quad \tan \alpha=\frac{\text{đối}}{\text{kề}}.$$

Bước 5: Với khoảng cách, hãy biến về khoảng cách từ điểm đến mặt phẳng nếu có thể. Ví dụ khoảng cách giữa hai đường chéo nhau thường xử lý bằng cách dựng mặt phẳng chứa một đường và song song với đường còn lại.

## III. Ví dụ minh họa

Cho hình chóp $S.ABC$ có $SA \perp (ABC)$, tam giác $ABC$ vuông tại $A$, $SA=a$, $AB=a$, $AC=a\sqrt{3}$. Tính góc giữa $SC$ và mặt phẳng $(ABC)$, đồng thời tính khoảng cách từ $S$ đến $(ABC)$.

Vì $SA \perp (ABC)$ nên hình chiếu của $S$ lên $(ABC)$ là $A$. Do $C \in (ABC)$, hình chiếu của đường thẳng $SC$ lên $(ABC)$ là $AC$. Vậy góc giữa $SC$ và $(ABC)$ là $\angle SCA$.

Xét tam giác vuông $SAC$ tại $A$:
$$SC=\sqrt{SA^2+AC^2}=\sqrt{a^2+3a^2}=2a.$$

Do đó
$$\sin \angle SCA=\frac{SA}{SC}=\frac{a}{2a}=\frac12.$$

Suy ra $\angle SCA=30^\circ$. Vậy góc giữa $SC$ và $(ABC)$ bằng $30^\circ$.

Khoảng cách từ $S$ đến $(ABC)$ chính là độ dài đoạn vuông góc từ $S$ đến mặt phẳng. Vì $SA \perp (ABC)$ nên
$$d(S,(ABC))=SA=a.$$

Ví dụ này cho thấy: khi có một cạnh bên vuông góc đáy, hình chiếu thường rất rõ ràng. Việc tính góc đường-mặt được đưa về một góc trong tam giác vuông.

## IV. Chú ý tránh sai

Không nên học thuộc rời rạc từng dạng mà cần nhớ bản chất: góc trong không gian luôn phải đưa về góc giữa hai đường thẳng cắt nhau; khoảng cách luôn gắn với đoạn vuông góc.

Khi tính góc giữa đường thẳng và mặt phẳng, nhiều học sinh lấy nhầm góc giữa đường thẳng đó với một đường bất kỳ trong mặt phẳng. Đúng phải là góc với **hình chiếu vuông góc** của nó.

Khi tính góc giữa hai mặt phẳng, không được lấy tùy tiện hai đường nằm trong hai mặt phẳng. Hai đường đó phải cùng vuông góc với giao tuyến.

Với khoảng cách giữa hai đường chéo nhau, không được lấy đoạn nối hai điểm bất kỳ. Đoạn cần tìm phải vuông góc với cả hai đường, hoặc phải quy về khoảng cách từ điểm đến mặt phẳng một cách hợp lệ.

#### Quy tắc chính

- Góc đường-mặt là góc giữa đường thẳng và hình chiếu của nó trên mặt phẳng.
- Góc mặt-mặt được đo bằng hai đường cùng vuông góc với giao tuyến.
- Khoảng cách luôn là độ dài đoạn vuông góc ngắn nhất.
- Muốn chứng minh đường thẳng vuông góc mặt phẳng, chứng minh nó vuông góc hai đường cắt nhau trong mặt phẳng.
- Luôn đưa bài toán không gian về tam giác phẳng để tính toán.

#### Lỗi thường gặp

- Sai: Lấy góc giữa đường thẳng và một đường bất kỳ trong mặt phẳng -> Đúng: Lấy góc với hình chiếu vuông góc của đường thẳng.
- Sai: Tính góc hai mặt phẳng bằng hai cạnh bất kỳ nằm trên hai mặt -> Đúng: Dựng hai đường cùng vuông góc với giao tuyến.
- Sai: Coi đoạn nối hai điểm bất kỳ trên hai đường chéo nhau là khoảng cách -> Đúng: Phải là đoạn vuông góc chung hoặc quy về điểm-mặt.
- Sai: Kết luận đường thẳng vuông góc mặt phẳng chỉ vì vuông góc một đường trong mặt phẳng -> Đúng: Cần vuông góc hai đường cắt nhau trong mặt phẳng.

---

## Chương 2: Ứng dụng đạo hàm và khảo sát hàm số

- Môn: `toan_dai`
- Số bài: 7

### 6. Tính đơn điệu của hàm số

- ID: `a1f3a00c-eab1-5750-8a75-3336957a642d`
- Chủ đề: Khảo sát hàm số
- Mức độ: `nhan_biet`
- Số bài tập: 10

## I. Công thức & định nghĩa cốt lõi

Cho hàm số $y=f(x)$ xác định trên khoảng, đoạn hoặc nửa khoảng $K$.

- Hàm số $f(x)$ **đồng biến** trên $K$ nếu với mọi $x_1,x_2\in K$, $x_1<x_2$ thì $f(x_1)<f(x_2)$.
- Hàm số $f(x)$ **nghịch biến** trên $K$ nếu với mọi $x_1,x_2\in K$, $x_1<x_2$ thì $f(x_1)>f(x_2)$.

Trong chương trình THPT, ta thường xét điều kiện qua đạo hàm. Giả sử hàm số $f$ liên tục trên $K$ và có đạo hàm trên phần trong của $K$.

**Điều kiện đủ:**

- Nếu $f'(x)>0$ với mọi $x$ trong khoảng đang xét thì $f$ đồng biến trên khoảng đó.
- Nếu $f'(x)<0$ với mọi $x$ trong khoảng đang xét thì $f$ nghịch biến trên khoảng đó.

**Điều kiện cần và đủ thường dùng:**

Hàm số $f$ đồng biến trên khoảng $K$ khi và chỉ khi $f'(x)\ge 0$ với mọi $x\in K$, trừ một số điểm rời rạc mà tại đó $f'(x)=0$ nhưng không làm đổi chiều tăng của hàm số.

Tương tự, hàm số $f$ nghịch biến trên khoảng $K$ khi và chỉ khi $f'(x)\le 0$ với mọi $x\in K$, trừ một số điểm rời rạc mà tại đó $f'(x)=0$ nhưng không làm đổi chiều giảm của hàm số.

Nói ngắn gọn trong bài thi: muốn xét đồng biến, nghịch biến, ta xét dấu của $f'(x)$ trên từng khoảng xác định.

## II. Phương pháp làm nhanh

Bước 1. Tìm tập xác định $D$ của hàm số. Đây là bước rất quan trọng vì hàm số chỉ có thể đồng biến hoặc nghịch biến trên các khoảng con thuộc tập xác định.

Bước 2. Tính đạo hàm $f'(x)$.

Bước 3. Giải bất phương trình dấu:

- Đồng biến: xét $f'(x)\ge 0$ hoặc $f'(x)>0$ tùy yêu cầu đề.
- Nghịch biến: xét $f'(x)\le 0$ hoặc $f'(x)<0$ tùy yêu cầu đề.

Bước 4. Lập bảng xét dấu $f'(x)$ theo các nghiệm của $f'(x)=0$ và các điểm làm đạo hàm không xác định.

Bước 5. Kết luận trên từng khoảng. Nếu $f'(x)>0$ trên khoảng nào thì hàm số đồng biến trên khoảng đó; nếu $f'(x)<0$ trên khoảng nào thì hàm số nghịch biến trên khoảng đó.

Với bài nhận biết, thường chỉ cần nhớ: dấu dương của đạo hàm ứng với đồng biến, dấu âm của đạo hàm ứng với nghịch biến.

## III. Ví dụ minh họa

**Ví dụ 1.** Xét tính đơn điệu của hàm số $y=x^3-3x+1$.

Ta có:

$$f'(x)=3x^2-3=3(x-1)(x+1).$$

Cho $f'(x)=0$ ta được $x=-1$ hoặc $x=1$.

Xét dấu $f'(x)$:

- Trên $(-\infty;-1)$, $f'(x)>0$ nên hàm số đồng biến.
- Trên $(-1;1)$, $f'(x)<0$ nên hàm số nghịch biến.
- Trên $(1;+\infty)$, $f'(x)>0$ nên hàm số đồng biến.

Vậy hàm số đồng biến trên $(-\infty;-1)$ và $(1;+\infty)$, nghịch biến trên $(-1;1)$.

**Ví dụ 2.** Cho hàm số $y=\dfrac{x+1}{x-2}$. Xét tính đơn điệu.

Tập xác định: $D=\mathbb{R}\setminus\{2\}$.

Ta có:

$$y'=\frac{(x-2)-(x+1)}{(x-2)^2}=\frac{-3}{(x-2)^2}.$$

Vì $(x-2)^2>0$ với mọi $x\ne 2$, nên $y'<0$ trên từng khoảng xác định.

Do đó hàm số nghịch biến trên $(-\infty;2)$ và $(2;+\infty)$.

Lưu ý: không được kết luận hàm số nghịch biến trên $\mathbb{R}\setminus\{2\}$ như một khoảng duy nhất, vì tập này bị gián đoạn tại $x=2$.

## IV. Chú ý tránh sai

Không chỉ nhìn vào nghiệm của $f'(x)=0$ rồi kết luận ngay. Cần xét dấu của $f'(x)$ trên từng khoảng.

Khi đạo hàm bằng $0$ tại một vài điểm, hàm số vẫn có thể đồng biến hoặc nghịch biến. Ví dụ $y=x^3$ có $y'=3x^2\ge 0$ và bằng $0$ tại $x=0$, nhưng hàm số vẫn đồng biến trên $\mathbb{R}$.

Với hàm phân thức, căn thức, logarit, phải tìm tập xác định trước. Các điểm không thuộc tập xác định không được đưa vào khoảng đơn điệu.

Cần phân biệt “đồng biến trên từng khoảng” với “đồng biến trên hợp các khoảng”. Nếu tập xác định bị ngắt quãng, ta kết luận riêng trên từng khoảng liên tục.

#### Quy tắc chính

- Dấu của $f'(x)$ quyết định chiều biến thiên của hàm số.
- $f'(x)>0$ trên khoảng nào thì hàm số đồng biến trên khoảng đó.
- $f'(x)<0$ trên khoảng nào thì hàm số nghịch biến trên khoảng đó.
- Luôn tìm tập xác định trước khi xét đạo hàm.
- Không gộp các khoảng bị ngắt bởi điểm không xác định.

#### Lỗi thường gặp

- Sai: Thấy $f'(x)=0$ tại một điểm thì kết luận hàm số không đồng biến. -> Đúng: Cần xét dấu $f'(x)$ trên cả khoảng.
- Sai: Bỏ qua tập xác định khi xét hàm phân thức. -> Đúng: Tìm tập xác định rồi xét từng khoảng thuộc tập xác định.
- Sai: Kết luận đồng biến trên hợp hai khoảng rời nhau. -> Đúng: Kết luận riêng trên từng khoảng liên tục.
- Sai: Chỉ giải $f'(x)=0$ mà không lập bảng xét dấu. -> Đúng: Phải xét dấu $f'(x)$ để xác định đồng biến hay nghịch biến.

---

### 7. Điểm cực đại, cực tiểu và cực trị hàm số

- ID: `47291591-59c8-554c-b3b1-b1257797591c`
- Chủ đề: Khảo sát hàm số
- Mức độ: `nhan_biet`
- Số bài tập: 10

## I. Công thức & định nghĩa cốt lõi

Trong chương trình THPT, khi xét cực trị của hàm số $y=f(x)$, ta cần phân biệt rõ ba khái niệm: **điểm cực đại**, **điểm cực tiểu** và **điểm tới hạn**.

Hàm số $f(x)$ đạt **cực đại** tại $x_0$ nếu tồn tại một khoảng nhỏ chứa $x_0$ sao cho với mọi $x$ đủ gần $x_0$, ta có:

$$f(x) \le f(x_0).$$

Khi đó $x_0$ gọi là **điểm cực đại**, còn $f(x_0)$ gọi là **giá trị cực đại**.

Tương tự, hàm số $f(x)$ đạt **cực tiểu** tại $x_0$ nếu tồn tại một khoảng nhỏ chứa $x_0$ sao cho:

$$f(x) \ge f(x_0).$$

Khi đó $x_0$ là **điểm cực tiểu**, còn $f(x_0)$ là **giá trị cực tiểu**.

Một điểm $x_0$ được gọi là **điểm tới hạn** nếu $x_0$ thuộc tập xác định của hàm số và xảy ra một trong hai trường hợp:

$$f'(x_0)=0$$

hoặc $f'(x_0)$ không tồn tại.

Lưu ý quan trọng: **điểm cực trị luôn là điểm tới hạn**, nhưng **điểm tới hạn chưa chắc là điểm cực trị**. Đây là ý rất hay xuất hiện trong câu hỏi nhận biết.

## II. Phương pháp làm nhanh

Để xét cực đại, cực tiểu của hàm số, cách nhanh và chắc nhất là dùng **bảng biến thiên** hoặc xét dấu đạo hàm.

Bước 1: Tìm tập xác định $D$ của hàm số.

Bước 2: Tính đạo hàm $f'(x)$.

Bước 3: Tìm các điểm tới hạn, gồm các nghiệm của $f'(x)=0$ và các điểm làm $f'(x)$ không tồn tại nhưng vẫn thuộc tập xác định.

Bước 4: Xét dấu $f'(x)$ qua từng điểm tới hạn.

Nếu $f'(x)$ đổi dấu từ dương sang âm khi đi qua $x_0$, tức là hàm số tăng rồi giảm, thì $x_0$ là điểm cực đại.

Nếu $f'(x)$ đổi dấu từ âm sang dương khi đi qua $x_0$, tức là hàm số giảm rồi tăng, thì $x_0$ là điểm cực tiểu.

Nếu $f'(x)$ không đổi dấu khi đi qua $x_0$, thì $x_0$ không phải điểm cực trị.

Có thể ghi nhớ nhanh:

$$+ \to -: \text{ cực đại}, \qquad - \to +: \text{ cực tiểu}.$$

Trong đề trắc nghiệm, nếu có sẵn bảng biến thiên, ta không cần tính đạo hàm. Chỉ cần nhìn chiều biến thiên: tại vị trí hàm số chuyển từ tăng sang giảm là cực đại; từ giảm sang tăng là cực tiểu.

## III. Ví dụ minh họa

**Ví dụ 1.** Xét hàm số:

$$y=x^3-3x^2+2.$$

Ta có:

$$y'=3x^2-6x=3x(x-2).$$

Giải $y'=0$ được $x=0$ và $x=2$. Lập bảng xét dấu $y'$:

- Khi $x<0$, $y'>0$, hàm số tăng.
- Khi $0<x<2$, $y'<0$, hàm số giảm.
- Khi $x>2$, $y'>0$, hàm số tăng.

Vậy qua $x=0$, đạo hàm đổi dấu từ $+$ sang $-$ nên $x=0$ là điểm cực đại. Giá trị cực đại là:

$$y(0)=2.$$

Qua $x=2$, đạo hàm đổi dấu từ $-$ sang $+$ nên $x=2$ là điểm cực tiểu. Giá trị cực tiểu là:

$$y(2)=8-12+2=-2.$$

Kết luận: hàm số có điểm cực đại $x=0$, điểm cực tiểu $x=2$; giá trị cực đại bằng $2$, giá trị cực tiểu bằng $-2$.

**Ví dụ 2.** Xét hàm số:

$$y=x^3.$$

Ta có:

$$y'=3x^2.$$

Suy ra $y'=0$ khi $x=0$. Tuy nhiên $y'=3x^2 \ge 0$ với mọi $x$ và không đổi dấu khi đi qua $0$. Do đó $x=0$ là điểm tới hạn nhưng không phải điểm cực trị.

Ví dụ này cho thấy: không được kết luận cứ $f'(x_0)=0$ thì $x_0$ là cực đại hoặc cực tiểu.

## IV. Chú ý tránh sai

Thứ nhất, cần phân biệt **điểm cực trị** và **giá trị cực trị**. Điểm cực trị là hoành độ $x_0$, còn giá trị cực trị là $f(x_0)$. Ví dụ nói “hàm số đạt cực tiểu tại $x=2$” khác với “giá trị cực tiểu bằng $-2$”.

Thứ hai, điểm tới hạn phải thuộc tập xác định của hàm số. Nếu một giá trị làm đạo hàm không tồn tại nhưng không thuộc tập xác định thì không được xem là điểm tới hạn.

Thứ ba, cực trị là tính chất cục bộ, không nhất thiết là giá trị lớn nhất hay nhỏ nhất trên toàn bộ tập xác định. Một điểm cực đại chỉ cần lớn hơn các giá trị lân cận, không cần lớn nhất mọi nơi.

Thứ tư, khi đọc bảng biến thiên, phải nhìn chiều tăng giảm hai bên điểm xét. Nếu hàm số chỉ tăng rồi tiếp tục tăng, hoặc giảm rồi tiếp tục giảm, thì không có cực trị tại điểm đó.

Tóm lại, để nhận biết cực đại, cực tiểu, hãy tập trung vào sự đổi dấu của đạo hàm hoặc sự đổi chiều biến thiên của hàm số. Đây là chìa khóa nhanh nhất để xử lý dạng bài nhận biết trong đề thi THPT.

#### Quy tắc chính

- Cực đại khi đạo hàm đổi dấu từ dương sang âm.
- Cực tiểu khi đạo hàm đổi dấu từ âm sang dương.
- Điểm cực trị luôn là điểm tới hạn, nhưng điểm tới hạn chưa chắc là cực trị.
- Điểm tới hạn phải thuộc tập xác định của hàm số.
- Phân biệt hoành độ cực trị $x_0$ và giá trị cực trị $f(x_0)$.

#### Lỗi thường gặp

- Sai: Thấy $f'(x_0)=0$ liền kết luận có cực trị -> Đúng: Phải xét dấu $f'(x)$ hai bên $x_0$.
- Sai: Gọi $f(x_0)$ là điểm cực đại hoặc cực tiểu -> Đúng: $x_0$ là điểm cực trị, $f(x_0)$ là giá trị cực trị.
- Sai: Lấy cả điểm không thuộc tập xác định làm điểm tới hạn -> Đúng: Chỉ xét các điểm thuộc tập xác định.
- Sai: Nhầm cực đại với giá trị lớn nhất toàn hàm -> Đúng: Cực đại chỉ là lớn nhất trong một lân cận.

---

### 8. Giá trị lớn nhất và nhỏ nhất của hàm số

- ID: `5c36df0b-c095-58eb-880d-49d442bc1e8e`
- Chủ đề: Khảo sát hàm số
- Mức độ: `nhan_biet`
- Số bài tập: 10

## I. Công thức & định nghĩa cốt lõi

Cho hàm số $y=f(x)$ xác định trên tập $D$.

- Số $M$ được gọi là **giá trị lớn nhất** của $f(x)$ trên $D$ nếu:
$$f(x)\le M,\ \forall x\in D$$
và tồn tại $x_0\in D$ sao cho $f(x_0)=M$. Khi đó viết:
$$M=\max_D f(x).$$

- Số $m$ được gọi là **giá trị nhỏ nhất** của $f(x)$ trên $D$ nếu:
$$f(x)\ge m,\ \forall x\in D$$
và tồn tại $x_0\in D$ sao cho $f(x_0)=m$. Khi đó viết:
$$m=\min_D f(x).$$

Điểm rất quan trọng: GTLN, GTNN không chỉ là “giá trị chặn trên/chặn dưới”, mà hàm số phải **đạt được** giá trị đó tại một điểm thuộc tập đang xét.

Nếu hàm số liên tục trên đoạn kín $[a;b]$ thì luôn tồn tại GTLN và GTNN trên đoạn đó. Với khoảng mở $(a;b)$ hoặc nửa khoảng, hàm số có thể không đạt GTLN hoặc GTNN.

## II. Phương pháp làm nhanh

Với bài toán tìm GTLN, GTNN của hàm số trên một **đoạn** $[a;b]$, cách làm chuẩn là:

1. Tính đạo hàm $f'(x)$.
2. Giải phương trình $f'(x)=0$ để tìm các điểm tới hạn thuộc $(a;b)$.
3. Tính giá trị hàm số tại các điểm tới hạn và tại hai đầu mút $a,b$.
4. So sánh các giá trị đó: số lớn nhất là GTLN, số nhỏ nhất là GTNN.

Tóm tắt:
$$\max_{[a;b]} f(x),\ \min_{[a;b]} f(x)$$
được tìm bằng cách so sánh các giá trị:
$$f(a),\ f(b),\ f(x_1),\ f(x_2),\ldots$$
trong đó $x_i$ là nghiệm của $f'(x)=0$ nằm trong $(a;b)$.

Với bài toán trên **khoảng** như $(a;b)$, $(a;+\infty)$, cần xét thêm giới hạn ở biên:
$$\lim_{x\to a^+}f(x),\quad \lim_{x\to b^-}f(x).$$
Nếu giá trị chỉ tiến tới nhưng không đạt được, thì không được kết luận là GTLN hoặc GTNN.

## III. Ví dụ minh họa

**Ví dụ 1.** Tìm GTLN, GTNN của $f(x)=x^2-4x+1$ trên đoạn $[0;3]$.

Ta có:
$$f'(x)=2x-4.$$
Giải $f'(x)=0$:
$$2x-4=0\Rightarrow x=2.$$
Vì $2\in[0;3]$, ta tính:
$$f(0)=1,$$
$$f(2)=2^2-4\cdot2+1=-3,$$
$$f(3)=9-12+1=-2.$$
So sánh các giá trị $1,-3,-2$, ta được:
$$\max_{[0;3]} f(x)=1,$$
đạt tại $x=0$, và
$$\min_{[0;3]} f(x)=-3,$$
đạt tại $x=2$.

**Ví dụ 2.** Xét $f(x)=x$ trên khoảng $(0;1)$.

Ta thấy $0<x<1$ nên $f(x)$ luôn lớn hơn $0$ và nhỏ hơn $1$. Tuy nhiên hàm số không nhận giá trị $0$ hay $1$ vì $0,1$ không thuộc khoảng $(0;1)$. Do đó hàm số **không có GTNN và không có GTLN** trên $(0;1)$.

Ví dụ này giúp phân biệt giữa “tiệm cận tới” và “đạt được”. Dù $f(x)$ tiến gần $0$ khi $x\to0^+$, nhưng không tồn tại $x\in(0;1)$ để $f(x)=0$.

## IV. Chú ý tránh sai

Thứ nhất, trên đoạn kín $[a;b]$, không được quên tính giá trị tại hai đầu mút. Nhiều bài GTLN hoặc GTNN nằm ngay tại $a$ hoặc $b$, không nằm ở nghiệm của $f'(x)=0$.

Thứ hai, nghiệm của $f'(x)=0$ chỉ được xét nếu nó thuộc khoảng đang xét. Nếu nghiệm nằm ngoài đoạn hoặc ngoài khoảng thì phải loại.

Thứ ba, trên khoảng mở, không được lấy giá trị ở đầu mút nếu đầu mút không thuộc tập xác định. Chẳng hạn trên $(0;1)$, không được tính $f(0)$ hoặc $f(1)$ như giá trị đạt được.

Thứ tư, cần phân biệt “có chặn” với “có GTLN, GTNN”. Một hàm số có thể bị chặn trên, chặn dưới nhưng vẫn không đạt được giá trị lớn nhất hoặc nhỏ nhất.

Khi làm bài nhận biết, hãy nhớ quy trình ngắn: xác định tập xét, tìm điểm tới hạn, xét đầu mút nếu có, rồi so sánh giá trị hàm số.

#### Quy tắc chính

- GTLN, GTNN phải là giá trị hàm số đạt được tại điểm thuộc tập xét.
- Trên đoạn kín, luôn xét cả hai đầu mút và các điểm tới hạn.
- Trên khoảng mở, không được tự ý lấy giá trị tại đầu mút.
- Nghiệm của $f'(x)=0$ chỉ xét khi nằm trong miền đang xét.
- So sánh giá trị hàm số, không so sánh trực tiếp hoành độ.

#### Lỗi thường gặp

- Sai: Chỉ giải $f'(x)=0$ rồi kết luận GTLN, GTNN -> Đúng: Phải tính thêm giá trị tại đầu mút nếu xét trên đoạn.
- Sai: Lấy $f(a)$ khi xét trên khoảng $(a;b)$ -> Đúng: Chỉ xét $f(a)$ nếu $a$ thuộc miền đang xét.
- Sai: Thấy hàm bị chặn thì kết luận có GTLN, GTNN -> Đúng: Cần kiểm tra hàm có đạt giá trị chặn đó không.
- Sai: Giữ mọi nghiệm của $f'(x)=0$ -> Đúng: Loại nghiệm không thuộc khoảng hoặc đoạn đang xét.

---

### 9. Tiệm cận đứng và tiệm cận ngang

- ID: `2aaf078a-e97f-5719-847e-229f928519fa`
- Chủ đề: Khảo sát hàm số
- Mức độ: `nhan_biet`
- Số bài tập: 10

## I. Công thức & định nghĩa cốt lõi

Trong chương trình Toán THPT, khi khảo sát đồ thị hàm số, ta thường gặp hai loại tiệm cận quan trọng: **tiệm cận đứng** và **tiệm cận ngang**.

### 1. Tiệm cận đứng

Đường thẳng $x=a$ được gọi là **tiệm cận đứng** của đồ thị hàm số $y=f(x)$ nếu ít nhất một trong các giới hạn sau bằng vô cực:

$$\lim_{x\to a^+} f(x)=\pm\infty$$

hoặc

$$\lim_{x\to a^-} f(x)=\pm\infty.$$

Nói đơn giản: khi $x$ tiến gần đến $a$, nếu giá trị hàm số tăng hoặc giảm không bị chặn thì đồ thị tiến sát đường thẳng $x=a$.

### 2. Tiệm cận ngang

Đường thẳng $y=b$ được gọi là **tiệm cận ngang** của đồ thị hàm số $y=f(x)$ nếu:

$$\lim_{x\to +\infty} f(x)=b$$

hoặc

$$\lim_{x\to -\infty} f(x)=b.$$

Nghĩa là khi $x$ tiến ra vô cực, nếu giá trị hàm số tiến dần đến một số hữu hạn $b$, thì $y=b$ là tiệm cận ngang.

Với hàm phân thức $y=\dfrac{P(x)}{Q(x)}$, tiệm cận đứng thường xuất hiện tại nghiệm của mẫu số $Q(x)=0$, nhưng cần chú ý kiểm tra xem tử và mẫu có triệt tiêu chung hay không.

## II. Phương pháp làm nhanh

Để nhận biết tiệm cận đứng và tiệm cận ngang, ta làm theo các bước sau.

### 1. Tìm tiệm cận đứng

Bước 1: Tìm các giá trị làm mẫu số bằng $0$ hoặc làm hàm số không xác định.

Bước 2: Xét giới hạn của hàm số khi $x$ tiến đến các giá trị đó từ bên trái hoặc bên phải.

Bước 3: Nếu giới hạn bằng $+\infty$ hoặc $-\infty$, kết luận có tiệm cận đứng.

Ví dụ với hàm phân thức:

$$y=\dfrac{P(x)}{Q(x)}.$$

Nếu $Q(a)=0$, $P(a)\ne 0$, thì thường $x=a$ là tiệm cận đứng.

Nếu $P(a)=Q(a)=0$, cần rút gọn trước rồi mới xét tiếp.

### 2. Tìm tiệm cận ngang

Ta xét giới hạn khi $x\to +\infty$ và $x\to -\infty$.

Với hàm phân thức $y=\dfrac{P(x)}{Q(x)}$:

- Nếu bậc tử nhỏ hơn bậc mẫu, tiệm cận ngang là $y=0$.
- Nếu bậc tử bằng bậc mẫu, tiệm cận ngang là $y=\dfrac{a}{b}$, trong đó $a,b$ là hệ số của các hạng tử bậc cao nhất.
- Nếu bậc tử lớn hơn bậc mẫu, thường không có tiệm cận ngang.

Đây là mẹo rất nhanh trong bài trắc nghiệm nhận biết.

## III. Ví dụ minh họa

### Ví dụ 1

Tìm các đường tiệm cận của đồ thị hàm số:

$$y=\dfrac{2x+1}{x-3}.$$

Mẫu số bằng $0$ khi:

$$x-3=0 \Rightarrow x=3.$$

Tại $x=3$, tử số $2x+1=7\ne 0$, nên $x=3$ là tiệm cận đứng.

Xét tiệm cận ngang: tử và mẫu đều có bậc $1$. Hệ số bậc cao nhất của tử là $2$, của mẫu là $1$. Do đó:

$$\lim_{x\to \pm\infty}\dfrac{2x+1}{x-3}=2.$$

Vậy tiệm cận ngang là:

$$y=2.$$

Kết luận: đồ thị có tiệm cận đứng $x=3$ và tiệm cận ngang $y=2$.

### Ví dụ 2

Cho hàm số:

$$y=\dfrac{x^2-1}{x-1}.$$

Ta có:

$$x^2-1=(x-1)(x+1).$$

Với $x\ne 1$:

$$y=x+1.$$

Mặc dù mẫu số bằng $0$ tại $x=1$, nhưng sau khi rút gọn, hàm số không tiến ra vô cực khi $x\to 1$. Vì vậy $x=1$ không phải là tiệm cận đứng. Đây chỉ là điểm gián đoạn có thể khử.

## IV. Chú ý tránh sai

Không phải cứ mẫu số bằng $0$ là có tiệm cận đứng. Phải kiểm tra giới hạn hoặc xem tử có cùng bằng $0$ hay không.

Khi tìm tiệm cận ngang, chỉ xét giới hạn khi $x\to +\infty$ hoặc $x\to -\infty$, không xét tại một điểm hữu hạn.

Với hàm phân thức, mẹo so sánh bậc tử và bậc mẫu rất hữu ích, nhưng cần áp dụng sau khi biểu thức đã được rút gọn nếu có nhân tử chung.

Cũng cần phân biệt tiệm cận ngang và tiệm cận xiên. Nếu bậc tử lớn hơn bậc mẫu đúng $1$ đơn vị, hàm số có thể có tiệm cận xiên, không phải tiệm cận ngang.

Trong bài trắc nghiệm, hãy ưu tiên nhận biết nhanh: nghiệm mẫu không bị khử cho tiệm cận đứng; giới hạn ở vô cực cho tiệm cận ngang.

#### Quy tắc chính

- Tiệm cận đứng $x=a$ khi $\lim_{x\to a^\pm} f(x)=\pm\infty$.
- Tiệm cận ngang $y=b$ khi $\lim_{x\to \pm\infty} f(x)=b$ hữu hạn.
- Mẫu bằng $0$ chưa chắc có tiệm cận đứng; cần kiểm tra rút gọn.
- Phân thức có bậc tử nhỏ hơn bậc mẫu thì tiệm cận ngang là $y=0$.
- Bậc tử bằng bậc mẫu thì tiệm cận ngang là tỉ số hệ số cao nhất.

#### Lỗi thường gặp

- Sai: Thấy mẫu bằng $0$ là kết luận có tiệm cận đứng -> Đúng: Phải kiểm tra tử có triệt tiêu chung không và xét giới hạn.
- Sai: Tìm tiệm cận ngang bằng cách cho mẫu số bằng $0$ -> Đúng: Tiệm cận ngang phải xét giới hạn khi $x\to \pm\infty$.
- Sai: Hàm $\dfrac{x^2-1}{x-1}$ có tiệm cận đứng $x=1$ -> Đúng: Rút gọn được thành $x+1$, nên $x=1$ không là tiệm cận đứng.
- Sai: Bậc tử lớn hơn bậc mẫu vẫn kết luận có tiệm cận ngang -> Đúng: Trường hợp này thường không có tiệm cận ngang.

---

### 10. Đường tiệm cận xiên của đồ thị hàm số

- ID: `9242e6c4-80b1-5763-a443-eeed10b557e3`
- Chủ đề: Khảo sát hàm số
- Mức độ: `thong_hieu`
- Số bài tập: 10

## I. Công thức & định nghĩa cốt lõi

Đường thẳng $y=ax+b$ được gọi là **tiệm cận xiên** của đồ thị hàm số $y=f(x)$ nếu

$$\lim_{x\to +\infty}[f(x)-(ax+b)]=0$$

hoặc

$$\lim_{x\to -\infty}[f(x)-(ax+b)]=0.$$

Trong chương trình THPT, dạng rất hay gặp là hàm phân thức **bậc hai trên bậc nhất**:

$$y=\frac{Ax^2+Bx+C}{Dx+E},\quad A\ne0,\ D\ne0.$$

Vì bậc tử lớn hơn bậc mẫu đúng $1$ đơn vị nên đồ thị thường có **một tiệm cận xiên**. Cách tìm nhanh nhất là chia đa thức:

$$\frac{Ax^2+Bx+C}{Dx+E}=ax+b+\frac{r}{Dx+E}.$$

Khi đó, vì

$$\lim_{x\to\pm\infty}\frac{r}{Dx+E}=0,$$

nên đường tiệm cận xiên là

$$y=ax+b.$$

Nói ngắn gọn: **tiệm cận xiên chính là phần thương khi chia tử cho mẫu**.

## II. Phương pháp làm nhanh

Với hàm số

$$y=\frac{Ax^2+Bx+C}{Dx+E},$$

ta làm theo 3 bước:

**Bước 1.** Chia đa thức $Ax^2+Bx+C$ cho $Dx+E$.

**Bước 2.** Viết kết quả dưới dạng

$$y=ax+b+\frac{r}{Dx+E}.$$

**Bước 3.** Kết luận tiệm cận xiên là

$$y=ax+b.$$

Nếu muốn tìm hệ số nhanh mà không chia dài, ta đặt:

$$\frac{Ax^2+Bx+C}{Dx+E}=ax+b+\frac{r}{Dx+E}.$$

Nhân hai vế với $Dx+E$:

$$Ax^2+Bx+C=(ax+b)(Dx+E)+r.$$

Khai triển:

$$(ax+b)(Dx+E)=aD x^2+(aE+bD)x+bE.$$

So sánh hệ số:

$$aD=A \Rightarrow a=\frac{A}{D},$$

$$aE+bD=B \Rightarrow b=\frac{B-aE}{D}.$$

Phần dư $r$ không ảnh hưởng đến tiệm cận xiên, vì khi $x\to\pm\infty$ thì $\frac{r}{Dx+E}\to0$.

## III. Ví dụ minh họa

**Ví dụ 1.** Tìm tiệm cận xiên của đồ thị

$$y=\frac{x^2+3x+2}{x+1}.$$

Ta chia:

$$x^2+3x+2=(x+1)(x+2)+0.$$

Suy ra

$$y=x+2.$$

Vậy tiệm cận xiên là

$$\boxed{y=x+2}.$$

Lưu ý: trong ví dụ này phần dư bằng $0$, đồ thị thực chất trùng với đường thẳng $y=x+2$ tại mọi điểm xác định, trừ điểm làm mẫu bằng $0$ là $x=-1$.

**Ví dụ 2.** Tìm tiệm cận xiên của đồ thị

$$y=\frac{2x^2-3x+5}{x-2}.$$

Chia đa thức:

$$2x^2-3x+5=(x-2)(2x+1)+7.$$

Do đó

$$y=2x+1+\frac{7}{x-2}.$$

Vì

$$\lim_{x\to\pm\infty}\frac{7}{x-2}=0,$$

nên tiệm cận xiên là

$$\boxed{y=2x+1}.$$

**Ví dụ 3.** Tìm tiệm cận xiên của đồ thị

$$y=\frac{3x^2+x-4}{2x+1}.$$

Đặt tiệm cận xiên là $y=ax+b$. Ta có $A=3$, $B=1$, $D=2$, $E=1$.

Suy ra

$$a=\frac{A}{D}=\frac{3}{2}.$$

Tiếp theo:

$$aE+bD=B$$

nên

$$\frac{3}{2}+2b=1.$$

Do đó

$$2b=-\frac{1}{2}\Rightarrow b=-\frac{1}{4}.$$

Vậy tiệm cận xiên là

$$\boxed{y=\frac{3}{2}x-\frac{1}{4}}.$$

## IV. Chú ý tránh sai

Không phải hàm phân thức nào cũng có tiệm cận xiên. Với phân thức hữu tỉ, nếu bậc tử lớn hơn bậc mẫu đúng $1$ đơn vị thì có tiệm cận xiên. Nếu bậc tử bằng bậc mẫu thì thường là tiệm cận ngang. Nếu bậc tử nhỏ hơn bậc mẫu thì tiệm cận ngang thường là $y=0$.

Khi tìm tiệm cận xiên, không lấy nghiệm của mẫu số. Nghiệm của mẫu số liên quan đến tiệm cận đứng, không phải tiệm cận xiên. Ví dụ với $y=\frac{2x^2-3x+5}{x-2}$, $x=2$ là ứng viên tiệm cận đứng, còn tiệm cận xiên là $y=2x+1$.

Cũng cần nhớ rằng phần dư sau phép chia không được đưa vào phương trình tiệm cận xiên. Nếu viết $y=2x+1+\frac{7}{x-2}$ thì đường tiệm cận xiên chỉ là $y=2x+1$, vì phân thức nhỏ $\frac{7}{x-2}$ tiến về $0$ khi $x$ ra vô cực.

Mẹo kiểm tra nhanh: sau khi tìm được $y=ax+b$, hãy lấy $f(x)-(ax+b)$. Nếu biểu thức còn lại có giới hạn bằng $0$ khi $x\to\pm\infty$, kết quả đúng.

#### Quy tắc chính

- Bậc tử lớn hơn bậc mẫu đúng 1 thì xét tiệm cận xiên.
- Tiệm cận xiên là phần thương khi chia tử cho mẫu.
- Phần dư không thuộc phương trình tiệm cận xiên.
- Với $\frac{Ax^2+Bx+C}{Dx+E}$, hệ số góc là $a=\frac{A}{D}$.
- Luôn kiểm tra bằng giới hạn $\lim_{x\to\pm\infty}[f(x)-(ax+b)]=0$.

#### Lỗi thường gặp

- Sai: Lấy nghiệm mẫu số làm tiệm cận xiên -> Đúng: Nghiệm mẫu số liên quan đến tiệm cận đứng.
- Sai: Giữ cả phần dư trong phương trình tiệm cận xiên -> Đúng: Chỉ lấy phần thương $ax+b$.
- Sai: Gặp phân thức nào cũng kết luận có tiệm cận xiên -> Đúng: Chỉ có khi bậc tử lớn hơn bậc mẫu đúng 1.
- Sai: Chia đa thức nhầm dấu khi mẫu là $Dx+E$ -> Đúng: Có thể so sánh hệ số để kiểm tra lại $a$ và $b$.

---

### 11. Khảo sát sự biến thiên và đồ thị hàm số

- ID: `8c041bd8-cd3a-5268-9e01-b5bd09af0cc0`
- Chủ đề: Khảo sát hàm số
- Mức độ: `thong_hieu`
- Số bài tập: 10

## I. Công thức & định nghĩa cốt lõi

Khảo sát sự biến thiên và vẽ đồ thị hàm số là quá trình dùng đạo hàm, giới hạn và các yếu tố hình học để mô tả hình dạng của đồ thị. Với hàm số $y=f(x)$, các bước quan trọng gồm: tìm tập xác định, đạo hàm, cực trị, giới hạn, tiệm cận và bảng biến thiên.

Với hàm đa thức, chẳng hạn $y=ax^3+bx^2+cx+d$ hoặc $y=ax^4+bx^2+c$, tập xác định thường là $\mathbb{R}$. Hàm đa thức không có tiệm cận đứng. Ta xét đạo hàm $f'(x)$ để tìm khoảng đồng biến, nghịch biến:

- Nếu $f'(x)>0$ trên khoảng $K$ thì hàm số đồng biến trên $K$.
- Nếu $f'(x)<0$ trên khoảng $K$ thì hàm số nghịch biến trên $K$.
- Nếu $f'(x)$ đổi dấu từ $+$ sang $-$ tại $x_0$ thì $x_0$ là điểm cực đại.
- Nếu $f'(x)$ đổi dấu từ $-$ sang $+$ tại $x_0$ thì $x_0$ là điểm cực tiểu.

Với hàm phân thức $y=\dfrac{P(x)}{Q(x)}$, điều kiện xác định là $Q(x)\ne 0$. Nếu $x=a$ làm mẫu bằng $0$ và tử không đồng thời bằng $0$, thường có tiệm cận đứng $x=a$. Tiệm cận ngang được xét bằng giới hạn:

$$\lim_{x\to \pm\infty} f(x).$$

Ví dụ, nếu $y=\dfrac{ax+b}{cx+d}$ với $c\ne0$, tiệm cận ngang là $y=\dfrac{a}{c}$, tiệm cận đứng là $x=-\dfrac{d}{c}$.

## II. Phương pháp làm nhanh

Bước 1: Tìm tập xác định $D$. Với đa thức, ghi ngay $D=\mathbb{R}$. Với phân thức, loại các nghiệm của mẫu.

Bước 2: Tính đạo hàm $f'(x)$ và giải phương trình $f'(x)=0$ hoặc xét dấu $f'(x)$. Đây là bước quyết định bảng biến thiên.

Bước 3: Tính giá trị hàm số tại các điểm tới hạn. Nếu hàm có cực trị, cần ghi tọa độ đầy đủ: cực đại hoặc cực tiểu tại điểm $(x_0;f(x_0))$.

Bước 4: Tính giới hạn tại vô cực và tại các điểm loại khỏi tập xác định. Từ đó suy ra tiệm cận đứng, ngang hoặc xiên nếu có.

Bước 5: Lập bảng biến thiên. Bảng cần thể hiện các mốc $x$, dấu của $f'(x)$ và chiều biến thiên của $f(x)$. Sau đó dựa vào bảng để phác đồ thị.

Khi vẽ đồ thị, nên xác định thêm giao điểm với trục tọa độ nếu tính nhanh được. Giao với trục $Oy$ là $x=0$ nếu $0\in D$. Giao với trục $Ox$ là nghiệm của phương trình $f(x)=0$.

## III. Ví dụ minh họa

Xét hàm số $y=x^3-3x+1$.

Tập xác định: $D=\mathbb{R}$. Ta có:

$$y'=3x^2-3=3(x-1)(x+1).$$

Suy ra $y'=0 \Leftrightarrow x=\pm1$. Xét dấu: $y'>0$ trên $(-\infty,-1)$ và $(1,+\infty)$, $y'<0$ trên $(-1,1)$. Do đó hàm số đồng biến trên $(-\infty,-1)$, nghịch biến trên $(-1,1)$, đồng biến trên $(1,+\infty)$.

Tính giá trị:

$$y(-1)=(-1)^3-3(-1)+1=3,$$

$$y(1)=1-3+1=-1.$$

Vậy hàm số đạt cực đại tại $(-1;3)$ và cực tiểu tại $(1;-1)$. Vì là hàm bậc ba có hệ số cao nhất dương nên $\lim_{x\to -\infty}y=-\infty$, $\lim_{x\to +\infty}y=+\infty$. Dựa vào bảng biến thiên, đồ thị đi lên đến cực đại, đi xuống đến cực tiểu rồi lại đi lên.

Xét thêm hàm phân thức $y=\dfrac{2x+1}{x-1}$. Tập xác định $D=\mathbb{R}\setminus\{1\}$. Ta viết:

$$y=2+\dfrac{3}{x-1}.$$

Suy ra tiệm cận đứng $x=1$, tiệm cận ngang $y=2$. Đạo hàm:

$$y'=\dfrac{-3}{(x-1)^2}<0, \forall x\ne1.$$

Vậy hàm số nghịch biến trên từng khoảng $(-\infty,1)$ và $(1,+\infty)$, nhưng không được nói nghịch biến trên toàn bộ $D$ vì tập xác định bị ngắt tại $x=1$.

## IV. Chú ý tránh sai

Không chỉ giải $f'(x)=0$ rồi kết luận cực trị ngay. Phải xét dấu của $f'(x)$ hai bên điểm đó. Nếu đạo hàm không đổi dấu thì không có cực trị.

Với hàm phân thức, cần đặc biệt chú ý tập xác định. Các khoảng biến thiên phải tách theo nghiệm của mẫu số. Một hàm có thể cùng nghịch biến trên hai khoảng riêng biệt nhưng không nghịch biến trên hợp của hai khoảng đó.

Khi tìm tiệm cận đứng, không chỉ nhìn mẫu bằng $0$. Cần kiểm tra tử số tại điểm đó. Nếu tử và mẫu cùng bằng $0$, phải rút gọn hoặc xét giới hạn cẩn thận.

Khi vẽ đồ thị, không cần vẽ quá chính xác từng điểm, nhưng phải thể hiện đúng chiều biến thiên, cực trị, tiệm cận và giao điểm quan trọng. Đồ thị sai dáng thường làm mất nhiều điểm dù tính toán đúng.

#### Quy tắc chính

- Luôn bắt đầu bằng tập xác định của hàm số.
- Xét dấu $f'(x)$ để kết luận đồng biến, nghịch biến và cực trị.
- Với phân thức, phải tìm tiệm cận từ giới hạn.
- Khoảng biến thiên không được đi qua điểm không thuộc tập xác định.
- Vẽ đồ thị dựa trên bảng biến thiên, cực trị và tiệm cận.

#### Lỗi thường gặp

- Sai: Thấy $f'(x_0)=0$ liền kết luận có cực trị -> Đúng: Phải kiểm tra $f'(x)$ có đổi dấu qua $x_0$ hay không.
- Sai: Quên loại nghiệm của mẫu trong hàm phân thức -> Đúng: Tập xác định phải là $Q(x)\ne0$ trước khi khảo sát.
- Sai: Nói hàm phân thức nghịch biến trên toàn bộ tập xác định bị ngắt quãng -> Đúng: Chỉ kết luận trên từng khoảng xác định liên tục.
- Sai: Tìm tiệm cận đứng chỉ bằng cách cho mẫu bằng $0$ -> Đúng: Cần xét thêm tử số và giới hạn tại điểm đó.

---

### 12. Đọc hiểu bảng biến thiên và đồ thị đạo hàm f'(x)

- ID: `fbd91e71-9903-5dfd-a857-a6b584b1ebc9`
- Chủ đề: Khảo sát hàm số
- Mức độ: `van_dung`
- Số bài tập: 10

## I. Công thức & định nghĩa cốt lõi

Khi đọc bảng biến thiên hoặc đồ thị liên quan đến hàm số $f(x)$, điều quan trọng nhất là hiểu mối liên hệ giữa dấu của đạo hàm và chiều biến thiên:

- Nếu $f'(x)>0$ trên khoảng $(a;b)$ thì $f(x)$ đồng biến trên khoảng đó.
- Nếu $f'(x)<0$ trên khoảng $(a;b)$ thì $f(x)$ nghịch biến trên khoảng đó.
- Nếu $f'(x)$ đổi dấu từ $+$ sang $-$ tại $x_0$ thì $f(x)$ đạt cực đại tại $x_0$.
- Nếu $f'(x)$ đổi dấu từ $-$ sang $+$ tại $x_0$ thì $f(x)$ đạt cực tiểu tại $x_0$.

Với bảng biến thiên của $f(x)$, ta thường đọc trực tiếp các thông tin: tập xác định, khoảng đồng biến/nghịch biến, điểm cực trị, giá trị cực trị, giới hạn tại vô cực hoặc tại tiệm cận.

Với đồ thị $f'(x)$, ta không đọc trực tiếp hình dáng của $f(x)$, mà đọc dấu của $f'(x)$. Cụ thể, trên khoảng nào đồ thị $f'(x)$ nằm phía trên trục hoành thì $f'(x)>0$, suy ra $f(x)$ đồng biến. Trên khoảng nào đồ thị $f'(x)$ nằm phía dưới trục hoành thì $f'(x)<0$, suy ra $f(x)$ nghịch biến.

Ngoài ra, các nghiệm của $f'(x)=0$ là giao điểm của đồ thị $f'(x)$ với trục hoành. Tuy nhiên, không phải nghiệm nào của $f'(x)=0$ cũng tạo cực trị cho $f(x)$; chỉ khi $f'(x)$ đổi dấu tại nghiệm đó thì $f(x)$ mới có cực trị.

## II. Phương pháp làm nhanh

Bước 1: Xác định đối tượng đề bài cho. Nếu đề cho bảng biến thiên của $f(x)$ thì đọc trực tiếp. Nếu đề cho đồ thị $f'(x)$ thì phải chuyển sang dấu của đạo hàm.

Bước 2: Kẻ bảng dấu nhanh cho $f'(x)$. Tìm các điểm mà $f'(x)=0$ hoặc $f'(x)$ không xác định. Sau đó xét dấu $+$, $-$ trên từng khoảng.

Bước 3: Suy ra chiều biến thiên của $f(x)$ theo quy tắc:

$$f'(x)>0 \Rightarrow f(x) \text{ đồng biến}, \qquad f'(x)<0 \Rightarrow f(x) \text{ nghịch biến}.$$

Bước 4: Tìm cực trị bằng sự đổi dấu của $f'(x)$. Ghi nhớ:

$$+ \to - : \text{ cực đại}, \qquad - \to + : \text{ cực tiểu}.$$

Bước 5: Với bài hỏi số nghiệm phương trình $f(x)=m$, hãy nhìn số giao điểm của đường thẳng ngang $y=m$ với đồ thị $f(x)$ hoặc dùng bảng biến thiên để đếm. Khi dùng bảng biến thiên, cần chú ý các giá trị cực đại, cực tiểu và giới hạn hai đầu.

Một mẹo nhanh: Nếu đề cho đồ thị $f'(x)$, hãy quên tạm hình dạng cong lên hay cong xuống của nó. Điều cần quan tâm trước hết là đồ thị nằm trên hay dưới trục hoành.

## III. Ví dụ minh họa

Ví dụ: Cho đồ thị $f'(x)$ cắt trục hoành tại $x=-1$, $x=1$, $x=3$. Quan sát thấy $f'(x)>0$ trên $(-\infty;-1)$ và $(1;3)$, còn $f'(x)<0$ trên $(-1;1)$ và $(3;+\infty)$.

Từ đó suy ra:

- $f(x)$ đồng biến trên $(-\infty;-1)$ và $(1;3)$.
- $f(x)$ nghịch biến trên $(-1;1)$ và $(3;+\infty)$.

Xét cực trị:

- Tại $x=-1$, $f'(x)$ đổi dấu từ $+$ sang $-$ nên $f(x)$ đạt cực đại.
- Tại $x=1$, $f'(x)$ đổi dấu từ $-$ sang $+$ nên $f(x)$ đạt cực tiểu.
- Tại $x=3$, $f'(x)$ đổi dấu từ $+$ sang $-$ nên $f(x)$ đạt cực đại.

Vậy hàm số có hai điểm cực đại và một điểm cực tiểu.

Nếu đề hỏi hàm số $f(x)$ đồng biến trên khoảng nào, ta chọn các khoảng mà $f'(x)>0$. Nếu đề hỏi số điểm cực trị, ta đếm số lần $f'(x)$ đổi dấu khi đi qua các nghiệm.

Một dạng khác: Nếu bảng biến thiên cho thấy $f(x)$ tăng từ $-\infty$ đến giá trị $2$, sau đó giảm đến $-1$, rồi lại tăng đến $+\infty$, thì $x$ tại mức $2$ là điểm cực đại, $x$ tại mức $-1$ là điểm cực tiểu. Phương trình $f(x)=0$ sẽ có thể có 3 nghiệm nếu đường ngang $y=0$ cắt cả ba nhánh biến thiên.

## IV. Chú ý tránh sai

Không được nhầm đồ thị $f'(x)$ với đồ thị $f(x)$. Điểm cực trị của $f'(x)$ không nhất thiết là điểm cực trị của $f(x)$. Ta chỉ xét giao điểm của $f'(x)$ với trục hoành và sự đổi dấu quanh giao điểm đó.

Khi đọc bảng biến thiên, cần phân biệt điểm cực trị và giá trị cực trị. Điểm cực trị là hoành độ $x_0$, còn giá trị cực trị là $f(x_0)$.

Nếu $f'(x)=0$ tại $x_0$ nhưng dấu của $f'(x)$ không đổi, thì $f(x)$ không có cực trị tại $x_0$. Đây là bẫy rất thường gặp trong đề thi.

Khi đếm nghiệm $f(x)=m$, không chỉ nhìn số cực trị mà phải so sánh $m$ với các mức giá trị trên bảng biến thiên. Một đường ngang có thể cắt đồ thị nhiều lần, ít lần hoặc không cắt tùy vị trí của $m$.

#### Quy tắc chính

- $f'(x)>0$ thì $f(x)$ đồng biến; $f'(x)<0$ thì $f(x)$ nghịch biến.
- Cực trị của $f(x)$ xuất hiện khi $f'(x)$ đổi dấu.
- Đồ thị $f'(x)$ nằm trên trục hoành nghĩa là đạo hàm dương.
- Nghiệm của $f'(x)=0$ chưa chắc là điểm cực trị.
- Đếm nghiệm $f(x)=m$ bằng số giao điểm với đường thẳng ngang $y=m$.

#### Lỗi thường gặp

- Sai: Nhìn cực trị của đồ thị $f'(x)$ rồi kết luận cực trị của $f(x)$ -> Đúng: Phải xét nghiệm và dấu của $f'(x)$.
- Sai: Thấy $f'(x)=0$ là kết luận có cực trị -> Đúng: Chỉ có cực trị khi $f'(x)$ đổi dấu.
- Sai: Nhầm điểm cực trị với giá trị cực trị -> Đúng: Điểm cực trị là $x_0$, giá trị cực trị là $f(x_0)$.
- Sai: Đếm nghiệm $f(x)=m$ chỉ dựa vào số cực trị -> Đúng: Phải so sánh $m$ với các giá trị trên bảng biến thiên.

---

## Chương 3: Ứng dụng đạo hàm thực tế

- Môn: `toan_dai`
- Số bài: 4

### 13. Mô hình hóa bài toán thực tế một biến

- ID: `3ed938fa-a76e-59c3-9b15-f3b68388bca8`
- Chủ đề: Ứng dụng đạo hàm thực tế
- Mức độ: `thong_hieu`
- Số bài tập: 10

## I. Công thức & định nghĩa cốt lõi

**Mô hình hóa bài toán thực tế một biến** là quá trình chuyển một tình huống đời sống thành một hàm số dạng $y=f(x)$, trong đó $x$ là biến đại diện cho đại lượng cần chọn hoặc cần thay đổi, còn $y$ là đại lượng cần tính, cần tối ưu hoặc cần khảo sát.

Trong các bài toán THPT, ta thường gặp các đại lượng như chiều dài, chiều rộng, thời gian, vận tốc, giá bán, số sản phẩm, doanh thu, chi phí, lợi nhuận, diện tích, thể tích. Mục tiêu là biểu diễn tất cả các đại lượng theo **một biến duy nhất**.

Một số mô hình cơ bản:

- Doanh thu: $R(x)=\text{giá bán}\cdot \text{số lượng}$.
- Lợi nhuận: $P(x)=R(x)-C(x)$, với $C(x)$ là chi phí.
- Diện tích hình chữ nhật: $S=ab$.
- Chu vi hình chữ nhật: $2(a+b)$.
- Thể tích hình hộp chữ nhật: $V=abc$.
- Quãng đường: $s=vt$.

Điểm quan trọng nhất là xác định đúng **biến độc lập** và **điều kiện của biến**. Ví dụ nếu gọi chiều rộng là $x$ thì phải có $x>0$; nếu chiều dài là $20-x$ thì cần thêm $20-x>0$, suy ra $0<x<20$.

## II. Phương pháp làm nhanh

Bước 1: Đọc đề và xác định đại lượng cần tìm. Hỏi: đề yêu cầu tối đa, tối thiểu, tính giá trị hay lập công thức?

Bước 2: Chọn một biến $x$ cho đại lượng thuận tiện nhất. Nên chọn đại lượng xuất hiện nhiều hoặc dễ liên hệ với các đại lượng khác.

Bước 3: Dùng dữ kiện đề bài để biểu diễn các đại lượng còn lại theo $x$. Nếu còn hai biến, cần tìm thêm mối quan hệ để khử bớt một biến.

Bước 4: Lập hàm số mục tiêu $f(x)$. Đây là biểu thức của đại lượng cần tối ưu hoặc cần khảo sát, chẳng hạn diện tích, thể tích, doanh thu, lợi nhuận.

Bước 5: Tìm tập xác định thực tế của $x$. Đây là bước rất quan trọng vì bài toán thực tế không chỉ cần công thức đúng mà còn cần miền giá trị hợp lý.

Bước 6: Nếu bài toán yêu cầu tối ưu, dùng công cụ phù hợp: biến đổi đại số, đạo hàm, bảng biến thiên hoặc bất đẳng thức.

Mẫu tư duy ngắn gọn: **Chọn biến $x$ → biểu diễn các đại lượng theo $x$ → lập hàm $f(x)$ → tìm điều kiện $x$ → giải yêu cầu**.

## III. Ví dụ minh họa

**Ví dụ:** Một mảnh vườn hình chữ nhật có chu vi $40$ m. Người ta muốn rào vườn sao cho diện tích lớn nhất. Hãy lập hàm số một biến biểu diễn diện tích theo chiều rộng.

Gọi chiều rộng mảnh vườn là $x$ mét. Vì chiều rộng dương nên $x>0$.

Chu vi hình chữ nhật là:

$$2(\text{dài}+\text{rộng})=40.$$

Suy ra:

$$\text{dài}+\text{rộng}=20.$$

Do chiều rộng là $x$, chiều dài là:

$$20-x.$$

Vì chiều dài cũng dương nên:

$$20-x>0 \Rightarrow x<20.$$

Vậy điều kiện thực tế là:

$$0<x<20.$$

Diện tích mảnh vườn là:

$$S(x)=x(20-x)=20x-x^2.$$

Như vậy, bài toán thực tế đã được chuyển thành bài toán khảo sát hàm một biến:

$$S(x)=20x-x^2,\quad 0<x<20.$$

Nếu cần tìm diện tích lớn nhất, ta nhận thấy đây là parabol quay xuống. Đỉnh parabol đạt tại:

$$x=\frac{-b}{2a}=\frac{-20}{2(-1)}=10.$$

Khi đó chiều rộng là $10$ m, chiều dài là $20-10=10$ m. Diện tích lớn nhất là:

$$S_{\max}=10\cdot 10=100\text{ m}^2.$$

Kết luận: Với chu vi cố định $40$ m, diện tích hình chữ nhật lớn nhất khi nó là hình vuông.

## IV. Chú ý tránh sai

Không nên vội lập công thức ngay khi chưa xác định biến. Một bài toán thực tế thường có nhiều đại lượng, nếu chọn biến không khéo sẽ làm biểu thức phức tạp.

Luôn kiểm tra đơn vị. Nếu chiều dài tính bằng mét thì diện tích phải tính bằng mét vuông; nếu thời gian tính bằng giờ thì vận tốc phải cùng hệ đơn vị với quãng đường.

Không bỏ qua điều kiện thực tế của biến. Trong toán thuần túy, hàm $S(x)=20x-x^2$ xác định với mọi $x\in\mathbb{R}$, nhưng trong bài toán mảnh vườn thì chỉ có ý nghĩa khi $0<x<20$.

Khi đề có các cụm như “giảm giá”, “tăng sản lượng”, “mỗi lần tăng thêm”, cần đọc kỹ để xác định biến biểu thị số lần thay đổi hay giá trị sau thay đổi. Đây là dạng rất hay gây nhầm lẫn trong bài toán doanh thu và lợi nhuận.

#### Quy tắc chính

- Chọn một biến $x$ thuận tiện và có ý nghĩa thực tế.
- Biểu diễn mọi đại lượng còn lại theo đúng biến $x$.
- Lập hàm mục tiêu trước khi giải tối ưu.
- Luôn tìm điều kiện thực tế của biến.
- Kiểm tra đơn vị và ý nghĩa kết quả cuối cùng.

#### Lỗi thường gặp

- Sai: Lập hàm có hai biến nhưng vẫn gọi là hàm một biến -> Đúng: Dùng dữ kiện ràng buộc để khử còn một biến.
- Sai: Quên điều kiện $x>0$, chiều dài dương, số sản phẩm không âm -> Đúng: Ghi rõ miền giá trị thực tế của $x$.
- Sai: Nhầm đại lượng cần tối ưu, ví dụ tối đa doanh thu thay vì lợi nhuận -> Đúng: Đọc kỹ yêu cầu và lập đúng hàm mục tiêu.
- Sai: Dùng sai đơn vị giữa giờ, phút, mét, ki-lô-mét -> Đúng: Quy đổi đơn vị trước khi lập công thức.

---

### 14. Bài toán tối ưu hóa diện tích và thể tích

- ID: `14e0a80a-6b54-5ed8-989b-8d2e70d330f3`
- Chủ đề: Ứng dụng đạo hàm thực tế
- Mức độ: `van_dung`
- Số bài tập: 10

## I. Công thức & định nghĩa cốt lõi

Bài toán tối ưu hóa hình học là dạng bài yêu cầu tìm kích thước của một hình sao cho diện tích, chu vi, thể tích hoặc một đại lượng hình học nào đó đạt giá trị lớn nhất hoặc nhỏ nhất.

Ý tưởng cốt lõi: biến bài toán hình học thành bài toán tìm cực trị của hàm số một biến.

Một số công thức thường dùng:

- Hình chữ nhật: $S=xy$, $P=2(x+y)$.
- Hình vuông cạnh $a$: $S=a^2$, $P=4a$.
- Tam giác: $S=\dfrac{1}{2}ah$, với $a$ là đáy, $h$ là chiều cao.
- Hình tròn bán kính $R$: $S=\pi R^2$, $C=2\pi R$.
- Hình hộp chữ nhật: $V=abc$, $S_{tp}=2(ab+bc+ca)$.
- Hình trụ bán kính đáy $R$, chiều cao $h$: $V=\pi R^2h$, $S_{xq}=2\pi Rh$, $S_{tp}=2\pi R^2+2\pi Rh$.
- Hình nón: $V=\dfrac{1}{3}\pi R^2h$.

Trong tối ưu hóa, ta thường có một điều kiện ràng buộc, ví dụ: tổng chiều dài vật liệu không đổi, diện tích toàn phần không đổi, thể tích không đổi. Điều kiện này giúp biểu diễn một biến theo biến còn lại.

Ví dụ nếu hình chữ nhật có chu vi $P$ không đổi thì:

$$2(x+y)=P \Rightarrow y=\dfrac{P}{2}-x.$$

Khi đó diện tích là:

$$S(x)=x\left(\dfrac{P}{2}-x\right).$$

Từ đây bài toán trở thành tìm giá trị lớn nhất của hàm $S(x)$ trên miền xác định.

## II. Phương pháp làm nhanh

Bước 1: Gọi biến hợp lý.

Chọn biến là kích thước cần tìm, thường đặt $x>0$, $R>0$, $h>0$. Cần ghi rõ đơn vị nếu đề bài có đơn vị.

Bước 2: Lập công thức đại lượng cần tối ưu.

Nếu đề hỏi diện tích lớn nhất thì lập $S$. Nếu hỏi thể tích lớn nhất thì lập $V$. Nếu hỏi chi phí nhỏ nhất thì lập biểu thức chi phí.

Bước 3: Dùng điều kiện ràng buộc để đưa về một biến.

Đây là bước quan trọng nhất. Phải dùng hết dữ kiện như chu vi cố định, diện tích vật liệu cố định, tổng cạnh cố định, hoặc thể tích cho trước.

Bước 4: Tìm miền xác định.

Ví dụ $x>0$, $y>0$ nên nếu $y=10-x$ thì $0<x<10$. Không được bỏ qua miền xác định vì cực trị phải xét trong miền bài toán cho phép.

Bước 5: Tìm max/min.

Có thể dùng đạo hàm:

$$f'(x)=0$$

rồi lập bảng biến thiên hoặc xét dấu. Với hàm bậc hai, có thể dùng đỉnh parabol. Nếu:

$$f(x)=ax^2+bx+c,\ a<0$$

thì $f$ đạt max tại:

$$x=-\dfrac{b}{2a}.$$

Nếu bài có dạng tích hai số dương có tổng không đổi, dùng bất đẳng thức AM-GM:

$$xy\leq \left(\dfrac{x+y}{2}\right)^2,$$

dấu bằng xảy ra khi $x=y$.

## III. Ví dụ minh họa

**Ví dụ 1.** Một mảnh vườn hình chữ nhật có chu vi $40$m. Tìm kích thước để diện tích lớn nhất.

Gọi chiều dài, chiều rộng lần lượt là $x,y>0$. Ta có:

$$2(x+y)=40 \Rightarrow x+y=20.$$

Diện tích:

$$S=xy.$$

Vì $x+y=20$ nên theo AM-GM:

$$xy\leq \left(\dfrac{x+y}{2}\right)^2=10^2=100.$$

Dấu bằng xảy ra khi $x=y=10$.

Vậy diện tích lớn nhất là $100$m$^2$, khi mảnh vườn là hình vuông cạnh $10$m.

**Ví dụ 2.** Từ một tấm bìa hình vuông cạnh $12$cm, cắt ở bốn góc bốn hình vuông cạnh $x$ rồi gấp thành hộp không nắp. Tìm $x$ để thể tích hộp lớn nhất.

Sau khi cắt, đáy hộp có kích thước $12-2x$ và chiều cao là $x$. Điều kiện:

$$0<x<6.$$

Thể tích:

$$V(x)=x(12-2x)^2.$$

Khai triển:

$$V(x)=x(144-48x+4x^2)=144x-48x^2+4x^3.$$

Đạo hàm:

$$V'(x)=144-96x+12x^2=12(x^2-8x+12).$$

Giải $V'(x)=0$:

$$x^2-8x+12=0 \Rightarrow x=2 \text{ hoặc } x=6.$$

Do $0<x<6$, chỉ nhận $x=2$. Kiểm tra dấu đạo hàm: $V'(x)>0$ trên $(0,2)$ và $V'(x)<0$ trên $(2,6)$ nên $V$ đạt cực đại tại $x=2$.

Vậy cần cắt bốn hình vuông cạnh $2$cm để hộp có thể tích lớn nhất.

## IV. Chú ý tránh sai

Luôn phân biệt đại lượng cần tối ưu với điều kiện ràng buộc. Ví dụ đề cho chu vi không đổi nhưng hỏi diện tích lớn nhất, ta không tối ưu chu vi mà dùng chu vi để biểu diễn biến.

Không được quên điều kiện dương của kích thước. Trong hình học, độ dài, bán kính, chiều cao luôn dương. Nếu nghiệm đạo hàm nằm ngoài miền xác định thì phải loại.

Với bài toán hộp, hình trụ, hình nón, cần xác định đúng kích thước sau khi cắt, gấp hoặc cuộn. Sai mô hình hình học sẽ dẫn đến sai toàn bộ hàm tối ưu.

Khi tìm được nghiệm làm đạo hàm bằng $0$, chưa được kết luận ngay. Cần kiểm tra đó là max hay min bằng bảng biến thiên, xét dấu đạo hàm, hoặc so sánh với biên nếu miền là đoạn kín.

#### Quy tắc chính

- Luôn đưa bài toán hình học về hàm một biến trước khi tối ưu.
- Phải xác định đúng điều kiện ràng buộc và miền xác định.
- Dùng đạo hàm hoặc AM-GM để tìm giá trị lớn nhất, nhỏ nhất.
- Nghiệm tối ưu phải thỏa mãn ý nghĩa hình học: độ dài, diện tích, thể tích dương.
- Sau khi tìm nghiệm, cần kết luận đầy đủ kích thước và giá trị max/min nếu đề hỏi.

#### Lỗi thường gặp

- Sai: Quên đặt điều kiện cho biến -> Đúng: Luôn ghi điều kiện như $x>0$, $0<x<6$, $R>0$.
- Sai: Dùng nhầm công thức diện tích, thể tích -> Đúng: Vẽ hình và xác định đúng kích thước trước khi lập hàm.
- Sai: Giải $f'(x)=0$ rồi kết luận ngay -> Đúng: Phải xét dấu đạo hàm, bảng biến thiên hoặc so sánh giá trị.
- Sai: Không dùng hết dữ kiện ràng buộc của đề -> Đúng: Biến đổi điều kiện để biểu diễn các đại lượng theo một biến.

---

### 15. Bài toán kinh tế doanh thu, lợi nhuận, chi phí

- ID: `391c805c-49eb-5015-9065-e3bb5c78160d`
- Chủ đề: Ứng dụng đạo hàm thực tế
- Mức độ: `van_dung`
- Số bài tập: 10

## I. Công thức & định nghĩa cốt lõi

Trong các bài toán kinh tế ở THPT, biến thường gặp là $x$, biểu thị số sản phẩm sản xuất hoặc bán được. Ta cần đọc kỹ đề để xác định $x$ thuộc khoảng nào, ví dụ $x>0$, $0<x<1000$, hoặc $x$ là số nguyên dương.

Hàm chi phí $C(x)$ là tổng chi phí để sản xuất $x$ sản phẩm. Thường có dạng:

$$C(x)=C_0+C_b(x),$$

trong đó $C_0$ là chi phí cố định, còn $C_b(x)$ là chi phí biến đổi theo số lượng sản phẩm.

Hàm doanh thu $R(x)$ là số tiền thu được khi bán $x$ sản phẩm. Nếu giá bán mỗi sản phẩm là $p(x)$ thì:

$$R(x)=x\cdot p(x).$$

Nếu giá bán không đổi $p$, ta có $R(x)=px$. Nếu giá bán phụ thuộc vào số lượng, chẳng hạn $p(x)=a-bx$, thì $R(x)=x(a-bx)$.

Hàm lợi nhuận $P(x)$ được tính bởi:

$$P(x)=R(x)-C(x).$$

Điểm hòa vốn là giá trị $x$ làm lợi nhuận bằng $0$:

$$P(x)=0.$$

Muốn tìm mức sản xuất hoặc bán hàng để lợi nhuận lớn nhất, ta khảo sát hàm $P(x)$ trên miền xác định của bài toán.

## II. Phương pháp làm nhanh

Bước 1: Đặt biến và điều kiện. Gọi $x$ là số sản phẩm sản xuất hoặc bán ra. Phải ghi rõ điều kiện của $x$ theo đề bài. Nếu đề nói tối đa 500 sản phẩm thì miền xét là $0\le x\le 500$.

Bước 2: Lập hàm chi phí $C(x)$. Tách chi phí cố định và chi phí biến đổi. Ví dụ chi phí ban đầu 10 triệu đồng và mỗi sản phẩm tốn 50 nghìn đồng thì $C(x)=10+0{,}05x$ nếu đơn vị là triệu đồng.

Bước 3: Lập hàm doanh thu $R(x)$. Nếu đề cho giá bán mỗi sản phẩm phụ thuộc vào $x$, cần nhân giá bán với số sản phẩm: $R(x)=x\cdot p(x)$.

Bước 4: Lập hàm lợi nhuận:

$$P(x)=R(x)-C(x).$$

Sau đó rút gọn biểu thức để dễ khảo sát.

Bước 5: Tìm cực trị. Nếu $P(x)$ là tam thức bậc hai $P(x)=ax^2+bx+c$ với $a<0$, lợi nhuận lớn nhất tại:

$$x_0=-\frac{b}{2a}.$$

Nếu $P(x)$ là hàm bậc ba, phân thức hoặc hàm phức tạp hơn, ta dùng đạo hàm: tính $P'(x)$, giải $P'(x)=0$, lập bảng biến thiên rồi kết luận trên miền xác định.

Bước 6: So sánh với điều kiện thực tế. Nếu $x_0$ không thuộc miền xác định hoặc không nguyên trong bài toán đếm sản phẩm, cần xét các giá trị hợp lệ gần nhất hoặc các đầu mút của đoạn.

## III. Ví dụ minh họa

Một cơ sở sản xuất bán một loại sản phẩm. Khi bán $x$ sản phẩm, giá bán mỗi sản phẩm là $p(x)=120-0{,}2x$ nghìn đồng. Chi phí sản xuất gồm 2000 nghìn đồng cố định và 40 nghìn đồng cho mỗi sản phẩm. Biết $0\le x\le 500$. Hỏi bán bao nhiêu sản phẩm thì lợi nhuận lớn nhất?

Ta có chi phí:

$$C(x)=2000+40x.$$

Doanh thu là:

$$R(x)=x(120-0{,}2x)=120x-0{,}2x^2.$$

Lợi nhuận:

$$P(x)=R(x)-C(x)=120x-0{,}2x^2-(2000+40x).$$

Suy ra:

$$P(x)=-0{,}2x^2+80x-2000.$$

Đây là parabol quay xuống vì hệ số $a=-0{,}2<0$, nên lợi nhuận lớn nhất tại đỉnh:

$$x_0=-\frac{b}{2a}=-\frac{80}{2(-0{,}2)}=200.$$

Vì $200\in[0,500]$, giá trị này hợp lệ. Lợi nhuận lớn nhất là:

$$P(200)=-0{,}2\cdot 200^2+80\cdot 200-2000=6000.$$

Vậy cơ sở nên bán $200$ sản phẩm, khi đó lợi nhuận lớn nhất là $6000$ nghìn đồng, tức $6$ triệu đồng.

## IV. Chú ý tránh sai

Thứ nhất, phải thống nhất đơn vị. Nếu chi phí cố định tính bằng triệu đồng còn giá bán tính bằng nghìn đồng, cần đổi về cùng một đơn vị trước khi lập hàm.

Thứ hai, không được nhầm doanh thu với giá bán. Giá bán mỗi sản phẩm là $p(x)$, còn doanh thu là $R(x)=x\cdot p(x)$.

Thứ ba, khi tìm lợi nhuận lớn nhất trên một đoạn, không chỉ xét điểm cực trị mà còn phải xét đầu mút nếu cần. Với hàm không phải parabol đơn giản, bảng biến thiên là công cụ an toàn nhất.

Thứ tư, cần chú ý ý nghĩa thực tế của $x$. Nếu $x$ là số sản phẩm thì thường $x$ phải là số nguyên không âm. Kết quả như $x=125{,}5$ không thể kết luận trực tiếp mà phải xét $x=125$ và $x=126$.

#### Quy tắc chính

- Luôn lập $P(x)=R(x)-C(x)$ sau khi đã thống nhất đơn vị.
- Doanh thu bằng số lượng nhân giá bán: $R(x)=x\cdot p(x)$.
- Muốn tối ưu lợi nhuận, khảo sát $P(x)$ trên đúng miền xác định.
- Nếu $P(x)=ax^2+bx+c$ và $a<0$, lợi nhuận lớn nhất tại $x=-\frac{b}{2a}$.
- Kết quả phải phù hợp thực tế: số lượng sản phẩm thường là số nguyên không âm.

#### Lỗi thường gặp

- Sai: Lấy luôn giá bán $p(x)$ làm doanh thu -> Đúng: Doanh thu là $R(x)=x\cdot p(x)$.
- Sai: Quên chi phí cố định khi lập $C(x)$ -> Đúng: Viết $C(x)=C_0+C_b(x)$.
- Sai: Tìm cực trị nhưng không kiểm tra miền xác định -> Đúng: So sánh điểm cực trị với điều kiện của $x$ và các đầu mút nếu có.
- Sai: Trộn đơn vị nghìn đồng và triệu đồng -> Đúng: Đổi tất cả về cùng một đơn vị trước khi tính.

---

### 16. Bài toán tốc độ thay đổi và tối ưu chuyển động

- ID: `05e5b5e4-e31b-51a6-84f2-431398d6a18f`
- Chủ đề: Ứng dụng đạo hàm thực tế
- Mức độ: `van_dung`
- Số bài tập: 10

## I. Công thức & định nghĩa cốt lõi

Trong các bài toán tối ưu hóa động học, ta thường cần tìm **giá trị lớn nhất, nhỏ nhất** của một đại lượng như vận tốc, thời gian, quãng đường, chi phí di chuyển. Công cụ chính là đạo hàm và khảo sát hàm số.

Nếu vị trí của vật theo thời gian là $s(t)$ thì:

$$v(t)=s'(t),\qquad a(t)=v'(t)=s''(t).$$

Trong đó $v(t)$ là vận tốc tức thời, $a(t)$ là gia tốc. Nếu vật chuyển động trên đường thẳng, quãng đường đi được trên đoạn thời gian $[a,b]$ là:

$$S=\int_a^b |v(t)|\,dt.$$

Nếu $v(t)\ge 0$ trên $[a,b]$ thì $S=s(b)-s(a)$. Nếu vận tốc đổi dấu, phải chia khoảng theo nghiệm của $v(t)=0$.

Bài toán **thời gian ít nhất** thường đưa về hàm thời gian $T(x)$ theo một biến phụ $x$, rồi tìm $\min T(x)$. Bài toán **quãng đường ngắn nhất** thường dùng công thức khoảng cách:

$$d=\sqrt{(x_2-x_1)^2+(y_2-y_1)^2}.$$

Khi có điểm di động trên đường thẳng, đường tròn, mặt phẳng, ta chọn biến phù hợp, lập hàm mục tiêu và xét miền xác định.

## II. Phương pháp làm nhanh

Bước 1: **Đọc kỹ đại lượng cần tối ưu**. Câu hỏi thường là “nhỏ nhất”, “lớn nhất”, “nhanh nhất”, “ngắn nhất”, “tốc độ thay đổi lớn nhất”. Cần xác định rõ hàm mục tiêu là $s(t)$, $v(t)$, $T(x)$ hay $d(x)$.

Bước 2: **Chọn biến hợp lý**. Nếu bài cho thời gian thì đặt biến $t$. Nếu bài có điểm cần chọn trên đoạn đường, đặt biến là khoảng cách từ một mốc cố định. Nếu bài có hình học, nên vẽ hình để biểu diễn các đoạn bằng một biến.

Bước 3: **Lập hàm mục tiêu**. Ví dụ, nếu đi từ $A$ đến $C$ qua điểm $B$ với hai vận tốc khác nhau, thời gian là:

$$T(x)=\frac{S_1(x)}{v_1}+\frac{S_2(x)}{v_2}.$$

Nếu cần tốc độ thay đổi của đại lượng $y=f(t)$ thì tính $y'(t)$. Nếu cần tốc độ thay đổi theo đại lượng khác, dùng quy tắc dây chuyền:

$$\frac{dy}{dt}=\frac{dy}{dx}\cdot \frac{dx}{dt}.$$

Bước 4: **Tối ưu bằng đạo hàm**. Tính $f'(x)$, giải $f'(x)=0$, xét thêm hai đầu mút miền xác định. So sánh các giá trị để kết luận.

Bước 5: **Kết luận đúng đơn vị**. Thời gian có thể là giây, phút, giờ; vận tốc có thể là m/s hoặc km/h. Sai đơn vị thường làm sai đáp án dù phép tính đúng.

## III. Ví dụ minh họa

Một người ở điểm $A$ trên bờ biển, muốn đến điểm $C$ ngoài khơi. Điểm $B$ trên bờ sao cho $AB=6$ km, $BC=2$ km vuông góc với bờ. Người đó chạy trên bờ với vận tốc $10$ km/h, bơi với vận tốc $5$ km/h. Hỏi nên rời bờ tại điểm $M$ cách $B$ bao nhiêu km để thời gian nhỏ nhất?

Gọi $BM=x$ km, với $0\le x\le 6$. Khi đó $AM=6-x$, còn:

$$MC=\sqrt{x^2+2^2}=\sqrt{x^2+4}.$$

Thời gian đi là:

$$T(x)=\frac{6-x}{10}+\frac{\sqrt{x^2+4}}{5}.$$

Ta tính đạo hàm:

$$T'(x)=-\frac{1}{10}+\frac{x}{5\sqrt{x^2+4}}.$$

Cho $T'(x)=0$:

$$\frac{x}{5\sqrt{x^2+4}}=\frac{1}{10}$$

$$2x=\sqrt{x^2+4}.$$

Bình phương hai vế:

$$4x^2=x^2+4\Rightarrow 3x^2=4\Rightarrow x=\frac{2}{\sqrt3}.$$

Vì $x\in[0,6]$, nghiệm này hợp lệ. So sánh hoặc xét dấu đạo hàm cho thấy $T(x)$ đạt nhỏ nhất tại:

$$BM=\frac{2}{\sqrt3}\text{ km}.$$

Vậy người đó nên rời bờ tại điểm $M$ cách $B$ khoảng $1{,}15$ km.

## IV. Chú ý tránh sai

Thứ nhất, cần phân biệt **độ dời** và **quãng đường**. Nếu vật đổi chiều, quãng đường không bằng $s(b)-s(a)$ mà phải dùng $\int |v(t)|dt$ hoặc chia đoạn theo dấu của $v(t)$.

Thứ hai, với bài tối ưu, không chỉ xét nghiệm $f'(x)=0$. Phải xét cả điều kiện biên của miền xác định, vì giá trị lớn nhất hoặc nhỏ nhất có thể nằm ở đầu mút.

Thứ ba, trong bài thời gian ít nhất, tổng thời gian không phải tổng quãng đường chia cho một vận tốc chung nếu từng đoạn có vận tốc khác nhau. Cần tính riêng từng đoạn.

Thứ tư, khi bình phương phương trình, phải kiểm tra nghiệm có thỏa điều kiện ban đầu và miền xác định hay không.

#### Quy tắc chính

- Tốc độ tức thời là đạo hàm của quãng đường: $v(t)=s'(t)$.
- Quãng đường phải xét $|v(t)|$ nếu vật có thể đổi chiều.
- Bài tối ưu luôn lập hàm mục tiêu và miền xác định trước.
- Giải $f'(x)=0$ rồi so sánh với các đầu mút.
- Luôn kiểm tra đơn vị và điều kiện thực tế của nghiệm.

#### Lỗi thường gặp

- Sai: Lấy quãng đường bằng $s(b)-s(a)$ trong mọi trường hợp -> Đúng: Nếu vận tốc đổi dấu, dùng $\int_a^b |v(t)|dt$ hoặc chia khoảng.
- Sai: Chỉ giải $f'(x)=0$ rồi kết luận ngay -> Đúng: Phải xét cả hai đầu mút miền xác định.
- Sai: Gộp các đoạn chuyển động khác vận tốc thành một vận tốc chung -> Đúng: Tính thời gian từng đoạn rồi cộng lại.
- Sai: Bình phương phương trình và nhận mọi nghiệm -> Đúng: Thử lại nghiệm với điều kiện ban đầu và ý nghĩa thực tế.

---

## Chương 4: Nguyên hàm và tích phân

- Môn: `toan_dai`
- Số bài: 7

### 17. Khái niệm và tính chất nguyên hàm

- ID: `d362f036-321c-562e-9026-7892b195d71e`
- Chủ đề: Nguyên hàm và tích phân
- Mức độ: `nhan_biet`
- Số bài tập: 10

## I. Công thức & định nghĩa cốt lõi

Trong chương trình Giải tích 12, **nguyên hàm** là kiến thức nền tảng để học tích phân. Ta nói hàm số $F(x)$ là một nguyên hàm của hàm số $f(x)$ trên khoảng $K$ nếu với mọi $x \in K$ ta có:

$$F'(x)=f(x).$$

Khi đó, tập tất cả các nguyên hàm của $f(x)$ trên $K$ được viết là:

$$\int f(x)\,dx=F(x)+C,$$

trong đó $C$ là hằng số tùy ý. Kí hiệu $\int f(x)\,dx$ gọi là **tích phân bất định** của $f(x)$.

Ý nghĩa cần nhớ: tìm nguyên hàm là quá trình “đi ngược” với đạo hàm. Nếu đạo hàm của $F(x)$ bằng $f(x)$ thì $F(x)$ là một nguyên hàm của $f(x)$.

Ví dụ: Vì $(x^3)'=3x^2$ nên $x^3$ là một nguyên hàm của $3x^2$. Do đó:

$$\int 3x^2\,dx=x^3+C.$$

Một tính chất rất quan trọng: nếu $F(x)$ là một nguyên hàm của $f(x)$ trên $K$ thì mọi nguyên hàm của $f(x)$ trên $K$ đều có dạng $F(x)+C$.

Các tính chất cơ bản:

$$\int [f(x)+g(x)]\,dx=\int f(x)\,dx+\int g(x)\,dx,$$

$$\int [f(x)-g(x)]\,dx=\int f(x)\,dx-\int g(x)\,dx,$$

$$\int kf(x)\,dx=k\int f(x)\,dx \quad (k \text{ là hằng số}).$$

Một số công thức thường dùng:

$$\int x^\alpha dx=\frac{x^{\alpha+1}}{\alpha+1}+C \quad (\alpha \ne -1),$$

$$\int \frac{1}{x}dx=\ln |x|+C,$$

$$\int e^x dx=e^x+C,$$

$$\int \cos x\,dx=\sin x+C,$$

$$\int \sin x\,dx=-\cos x+C.$$

## II. Phương pháp làm nhanh

Với dạng nhận biết, mục tiêu chính là xác định đúng định nghĩa, kí hiệu và tính chất. Khi gặp câu hỏi “Hàm nào là nguyên hàm của $f(x)$?”, hãy lấy đạo hàm từng đáp án. Đáp án đúng là hàm có đạo hàm bằng $f(x)$.

Khi gặp yêu cầu tính nguyên hàm đơn giản, hãy tách biểu thức thành từng hạng tử, đưa hằng số ra ngoài dấu nguyên hàm, rồi áp dụng công thức cơ bản. Ví dụ:

$$\int (2x+3)dx=2\int xdx+3\int dx=x^2+3x+C.$$

Một mẹo nhanh: sau khi tìm được kết quả, hãy đạo hàm ngược lại để kiểm tra. Nếu đạo hàm ra đúng biểu thức ban đầu thì kết quả đúng.

Đặc biệt, không được quên hằng số $C$. Trong nguyên hàm, hai hàm chỉ khác nhau một hằng số vẫn có cùng đạo hàm, nên đều là nguyên hàm của cùng một hàm số.

## III. Ví dụ minh họa

**Ví dụ 1.** Kiểm tra $F(x)=x^4+2$ có phải là nguyên hàm của $f(x)=4x^3$ không.

Ta có:

$$F'(x)=(x^4+2)'=4x^3.$$

Vậy $F(x)=x^4+2$ là một nguyên hàm của $f(x)=4x^3$.

**Ví dụ 2.** Tính:

$$\int (5x^4-2x+1)dx.$$

Ta có:

$$\int (5x^4-2x+1)dx=5\int x^4dx-2\int xdx+\int 1dx.$$

Suy ra:

$$=5\cdot \frac{x^5}{5}-2\cdot \frac{x^2}{2}+x+C=x^5-x^2+x+C.$$

**Ví dụ 3.** Hàm nào là nguyên hàm của $f(x)=\cos x$?

Vì $(\sin x)'=\cos x$, nên một nguyên hàm của $\cos x$ là $\sin x$. Do đó:

$$\int \cos x\,dx=\sin x+C.$$

## IV. Chú ý tránh sai

Sai lầm phổ biến nhất là nhầm nguyên hàm với đạo hàm. Ví dụ, thấy $x^2$ thì vội viết nguyên hàm là $2x$ là sai, vì $2x$ là đạo hàm của $x^2$. Nguyên hàm đúng là:

$$\int x^2dx=\frac{x^3}{3}+C.$$

Cần chú ý điều kiện đặc biệt của công thức lũy thừa. Công thức $\int x^\alpha dx=\frac{x^{\alpha+1}}{\alpha+1}+C$ không dùng được khi $\alpha=-1$. Khi đó:

$$\int \frac{1}{x}dx=\ln |x|+C.$$

Ngoài ra, khi làm trắc nghiệm, nhiều đáp án có thể chỉ khác nhau bởi hằng số. Nếu đề hỏi “một nguyên hàm”, các đáp án khác nhau hằng số đều có thể đúng về mặt toán học, nhưng đề thi thường thiết kế chỉ có một đáp án phù hợp. Hãy kiểm tra thêm điều kiện nếu đề cho như $F(1)=2$.

Tóm lại, để nhận biết nguyên hàm, chỉ cần nhớ: nguyên hàm là hàm mà khi đạo hàm sẽ ra hàm đã cho. Công cụ kiểm tra nhanh nhất luôn là lấy đạo hàm kết quả.

#### Quy tắc chính

- Nếu $F'(x)=f(x)$ thì $F(x)$ là nguyên hàm của $f(x)$.
- Tập nguyên hàm luôn có dạng $F(x)+C$.
- Nguyên hàm của tổng bằng tổng các nguyên hàm.
- Hằng số nhân được đưa ra ngoài dấu nguyên hàm.
- Kiểm tra kết quả bằng cách đạo hàm ngược lại.

#### Lỗi thường gặp

- Sai: Quên cộng hằng số $C$ -> Đúng: Luôn viết $+C$ khi tính nguyên hàm bất định.
- Sai: Dùng $\int x^\alpha dx=\frac{x^{\alpha+1}}{\alpha+1}+C$ cho $\alpha=-1$ -> Đúng: $\int \frac{1}{x}dx=\ln|x|+C$.
- Sai: Nhầm nguyên hàm với đạo hàm, ví dụ $\int x^2dx=2x$ -> Đúng: $\int x^2dx=\frac{x^3}{3}+C$.
- Sai: Bỏ qua hệ số khi tách nguyên hàm -> Đúng: Đưa hằng số ra ngoài rồi tính từng hạng tử.

---

### 18. Phương pháp đổi biến và từng phần tính nguyên hàm

- ID: `52ae2617-529d-5971-9a54-c24144dc8c39`
- Chủ đề: Nguyên hàm và tích phân
- Mức độ: `thong_hieu`
- Số bài tập: 10

## I. Công thức & định nghĩa cốt lõi

Nguyên hàm của hàm số $f(x)$ trên khoảng $K$ là hàm $F(x)$ sao cho $F'(x)=f(x)$ với mọi $x\in K$. Khi đó viết:

$$\int f(x)\,dx=F(x)+C.$$

Trong chuyên đề này, hai phương pháp quan trọng nhất là **đổi biến số** và **nguyên hàm từng phần**.

**1. Phương pháp đổi biến số**

Nếu đặt $u=g(x)$, khi đó $du=g'(x)dx$. Ta biến đổi tích phân về dạng theo $u$:

$$\int f(g(x))g'(x)\,dx=\int f(u)\,du.$$

Sau khi tính xong nguyên hàm theo $u$, phải thay lại $u=g(x)$.

Ví dụ dạng thường gặp:

$$\int \frac{g'(x)}{g(x)}dx=\ln|g(x)|+C,$$

$$\int f'(x)e^{f(x)}dx=e^{f(x)}+C.$$

**2. Phương pháp nguyên hàm từng phần**

Công thức cơ bản:

$$\int u\,dv=uv-\int v\,du.$$

Trong đó ta chọn $u$ là phần dễ đạo hàm, còn $dv$ là phần dễ lấy nguyên hàm. Phương pháp này thường dùng với tích của hai loại hàm: đa thức, lượng giác, mũ, logarit.

## II. Phương pháp làm nhanh

Với **đổi biến số**, hãy quan sát xem trong biểu thức có một hàm hợp và đạo hàm của nó hay không. Nếu thấy dạng $f(g(x))g'(x)$ thì đặt $u=g(x)$. Ví dụ có $2x$ đi cùng $x^2+1$ thì thường đặt $u=x^2+1$.

Các bước làm nhanh:

Bước 1: Chọn $u=g(x)$ là biểu thức bên trong hoặc biểu thức phức tạp.

Bước 2: Tính $du=g'(x)dx$.

Bước 3: Biến đổi toàn bộ tích phân sang biến $u$.

Bước 4: Tính nguyên hàm theo $u$, rồi thay lại $x$.

Với **từng phần**, có thể nhớ thứ tự ưu tiên chọn $u$ theo quy tắc LIATE: Logarit, Inverse lượng giác, Algebraic đa thức, Trigonometric lượng giác, Exponential mũ. Ở chương trình THPT, thường gặp nhất là:

- $\int x e^x dx$: chọn $u=x$, $dv=e^x dx$.
- $\int x\sin x dx$: chọn $u=x$, $dv=\sin x dx$.
- $\int \ln x dx$: viết thành $\int 1\cdot \ln x dx$, chọn $u=\ln x$, $dv=dx$.

Mục tiêu của từng phần là làm cho tích phân còn lại đơn giản hơn ban đầu.

## III. Ví dụ minh họa

**Ví dụ 1.** Tính $I=\int 2x(x^2+1)^5dx$.

Đặt $u=x^2+1$, suy ra $du=2x dx$. Khi đó:

$$I=\int u^5du=\frac{u^6}{6}+C=\frac{(x^2+1)^6}{6}+C.$$

Nhận xét: Đây là dạng đổi biến trực tiếp vì có biểu thức $x^2+1$ và đạo hàm của nó là $2x$.

**Ví dụ 2.** Tính $I=\int \frac{x}{x^2+3}dx$.

Đặt $u=x^2+3$, suy ra $du=2x dx$, nên $x dx=\frac{1}{2}du$. Do đó:

$$I=\frac{1}{2}\int \frac{1}{u}du=\frac{1}{2}\ln|u|+C=\frac{1}{2}\ln(x^2+3)+C.$$

Vì $x^2+3>0$ nên có thể bỏ dấu giá trị tuyệt đối ở kết quả cuối.

**Ví dụ 3.** Tính $I=\int x e^x dx$.

Chọn $u=x\Rightarrow du=dx$, chọn $dv=e^x dx\Rightarrow v=e^x$. Áp dụng công thức từng phần:

$$I=xe^x-\int e^x dx=xe^x-e^x+C=e^x(x-1)+C.$$

**Ví dụ 4.** Tính $I=\int \ln x dx$ với $x>0$.

Viết $I=\int \ln x\cdot 1 dx$. Chọn $u=\ln x\Rightarrow du=\frac{1}{x}dx$, $dv=dx\Rightarrow v=x$. Khi đó:

$$I=x\ln x-\int x\cdot \frac{1}{x}dx=x\ln x-x+C.$$

## IV. Chú ý tránh sai

Khi đổi biến, phải đổi cả $dx$ sang $du$. Nhiều học sinh chỉ đặt $u$ nhưng quên xử lý phần vi phân, dẫn đến sai hệ số. Nếu xuất hiện $du=2x dx$ mà trong tích phân chỉ có $x dx$, cần thay bằng $\frac{1}{2}du$.

Khi dùng từng phần, phải xác định đúng $u$, $dv$, rồi tính đúng $du$, $v$. Sai dấu khi lấy nguyên hàm lượng giác là lỗi rất thường gặp, ví dụ $\int \sin x dx=-\cos x+C$.

Luôn nhớ cộng hằng số $C$ ở cuối. Với nguyên hàm, thiếu $C$ là thiếu nghiệm tổng quát.

Cuối cùng, sau khi làm xong nên kiểm tra nhanh bằng cách lấy đạo hàm kết quả. Nếu đạo hàm quay lại đúng hàm dưới dấu tích phân thì kết quả đúng.

#### Quy tắc chính

- Đổi biến khi thấy hàm hợp đi cùng đạo hàm của nó.
- Sau khi đặt $u=g(x)$, luôn đổi cả $dx$ theo $du$.
- Từng phần dùng công thức $\int u\,dv=uv-\int v\,du$.
- Chọn $u$ sao cho đạo hàm đơn giản hơn.
- Luôn thay lại biến ban đầu và cộng hằng số $C$.

#### Lỗi thường gặp

- Sai: Đặt $u=x^2+1$ nhưng vẫn giữ $dx$ -> Đúng: Tính $du=2x dx$ rồi đổi toàn bộ tích phân.
- Sai: Quên hệ số khi $du=2x dx$ -> Đúng: Nếu chỉ có $x dx$ thì thay $x dx=\frac{1}{2}du$.
- Sai: Chọn $u=e^x$ trong $\int xe^x dx$ làm bài không đơn giản hơn -> Đúng: Chọn $u=x$, $dv=e^x dx$.
- Sai: Thiếu hằng số $C$ ở kết quả -> Đúng: Mọi nguyên hàm đều phải có $+C$.

---

### 19. Kỹ thuật tính nguyên hàm hàm lượng giác, phân thức

- ID: `bf7d5a07-ea2b-5ffc-8be1-80d2b7b6885c`
- Chủ đề: Nguyên hàm và tích phân
- Mức độ: `thong_hieu`
- Số bài tập: 10

## I. Công thức & định nghĩa cốt lõi

Nguyên hàm của hàm số $f(x)$ trên khoảng $K$ là hàm $F(x)$ sao cho $F'(x)=f(x)$. Khi đó ta viết:

$$\int f(x)\,dx=F(x)+C.$$

Với hàm lượng giác, cần nhớ các công thức cơ bản:

$$\int \sin x\,dx=-\cos x+C,\quad \int \cos x\,dx=\sin x+C.$$

$$\int \frac{1}{\cos^2 x}\,dx=\tan x+C,\quad \int \frac{1}{\sin^2 x}\,dx=-\cot x+C.$$

$$\int \tan x\,dx=-\ln|\cos x|+C,\quad \int \cot x\,dx=\ln|\sin x|+C.$$

Nếu có hàm hợp, ta dùng dạng mở rộng:

$$\int \sin(ax+b)\,dx=-\frac{1}{a}\cos(ax+b)+C,$$

$$\int \cos(ax+b)\,dx=\frac{1}{a}\sin(ax+b)+C.$$

Với hàm đặc biệt thường gặp:

$$\int e^x\,dx=e^x+C,\quad \int e^{ax+b}\,dx=\frac{1}{a}e^{ax+b}+C.$$

$$\int a^x\,dx=\frac{a^x}{\ln a}+C\quad (a>0,a\ne1).$$

$$\int \frac{1}{x}\,dx=\ln|x|+C,\quad \int \frac{u'(x)}{u(x)}\,dx=\ln|u(x)|+C.$$

Với hàm hữu tỷ đơn giản, dạng quan trọng nhất là:

$$\int \frac{dx}{ax+b}=\frac{1}{a}\ln|ax+b|+C\quad (a\ne0).$$

## II. Phương pháp làm nhanh

Bước đầu tiên là nhận dạng biểu thức. Nếu thấy hàm có dạng “đạo hàm của mẫu chia cho mẫu”, hãy nghĩ ngay đến logarit. Ví dụ $\frac{2x}{x^2+1}$ có tử là đạo hàm của mẫu $x^2+1$, nên:

$$\int \frac{2x}{x^2+1}\,dx=\ln(x^2+1)+C.$$

Nếu gặp $\sin(ax+b)$ hoặc $\cos(ax+b)$, cần chia thêm cho hệ số $a$ của $x$. Đây là điểm rất hay xuất hiện trong đề thi. Chẳng hạn:

$$\int \cos(3x-1)\,dx=\frac{1}{3}\sin(3x-1)+C.$$

Với phân thức bậc nhất trên bậc nhất, nên tách tử theo mẫu. Ví dụ:

$$\frac{2x+5}{x+1}=2+\frac{3}{x+1}.$$

Khi đó:

$$\int \frac{2x+5}{x+1}\,dx=\int \left(2+\frac{3}{x+1}\right)dx=2x+3\ln|x+1|+C.$$

Với lượng giác, nên biến đổi về các dạng quen thuộc. Ví dụ $1+\tan^2 x=\frac{1}{\cos^2 x}$, nên:

$$\int (1+\tan^2 x)\,dx=\tan x+C.$$

Nếu đề có tích như $\sin x\cos x$, ta có thể dùng đặt $u=\sin x$ hoặc $u=\cos x$. Chẳng hạn:

$$\int \sin x\cos x\,dx.$$

Đặt $u=\sin x$, $du=\cos x\,dx$, được:

$$\int u\,du=\frac{u^2}{2}+C=\frac{\sin^2 x}{2}+C.$$

## III. Ví dụ minh họa

Ví dụ 1. Tính $\int \left(2\sin x-3\cos x\right)dx$.

Ta lấy nguyên hàm từng phần:

$$\int 2\sin x\,dx=-2\cos x,$$

$$\int -3\cos x\,dx=-3\sin x.$$

Vậy:

$$\int \left(2\sin x-3\cos x\right)dx=-2\cos x-3\sin x+C.$$

Ví dụ 2. Tính $\int \frac{5}{2x-1}\,dx$.

Ta dùng công thức $\int \frac{dx}{ax+b}=\frac{1}{a}\ln|ax+b|+C$:

$$\int \frac{5}{2x-1}\,dx=5\cdot \frac{1}{2}\ln|2x-1|+C=\frac{5}{2}\ln|2x-1|+C.$$

Ví dụ 3. Tính $\int \frac{x+3}{x+1}\,dx$.

Tách phân thức:

$$\frac{x+3}{x+1}=1+\frac{2}{x+1}.$$

Do đó:

$$\int \frac{x+3}{x+1}\,dx=x+2\ln|x+1|+C.$$

Ví dụ 4. Tính $\int e^{4x-2}\,dx$.

Vì đạo hàm của $4x-2$ là $4$, nên phải chia cho $4$:

$$\int e^{4x-2}\,dx=\frac{1}{4}e^{4x-2}+C.$$

## IV. Chú ý tránh sai

Luôn kiểm tra bằng cách lấy đạo hàm kết quả. Nếu đạo hàm quay lại đúng biểu thức ban đầu thì nguyên hàm đúng. Khi có $ax+b$, học sinh thường quên chia cho $a$. Ví dụ nguyên hàm của $\sin(2x)$ là $-\frac{1}{2}\cos(2x)+C$, không phải $-\cos(2x)+C$.

Với logarit, bắt buộc có dấu giá trị tuyệt đối trong các dạng $\ln|u|$ nếu $u$ có thể âm. Ngoài ra, hằng số $C$ phải được viết ở cuối vì nguyên hàm là một họ hàm, không phải một hàm duy nhất.

Khi gặp phân thức, không nên áp dụng máy móc công thức logarit. Chỉ dùng $\ln|u|$ khi tử là hằng số nhân với $u'$ hoặc có thể tách về dạng đó. Nếu tử và mẫu cùng bậc, hãy chia hoặc tách phân thức trước.

#### Quy tắc chính

- Nhận dạng hàm hợp $ax+b$ thì luôn chia thêm cho hệ số $a$.
- Dạng $\frac{u'}{u}$ cho nguyên hàm là $\ln|u|+C$.
- Phân thức cùng bậc nên tách hoặc chia trước khi lấy nguyên hàm.
- Với lượng giác, ưu tiên đưa về $\sin x, \cos x, \tan x, \cot x$ và các công thức cơ bản.
- Luôn kiểm tra kết quả bằng cách lấy đạo hàm ngược lại.

#### Lỗi thường gặp

- Sai: $\int \cos(3x)dx=\sin(3x)+C$ -> Đúng: $\int \cos(3x)dx=\frac{1}{3}\sin(3x)+C$.
- Sai: $\int \frac{1}{x-2}dx=\ln(x-2)+C$ -> Đúng: $\int \frac{1}{x-2}dx=\ln|x-2|+C$.
- Sai: $\int \tan x\,dx=\ln|\cos x|+C$ -> Đúng: $\int \tan x\,dx=-\ln|\cos x|+C$.
- Sai: Gặp $\frac{x+3}{x+1}$ thì lấy ngay $\ln|x+1|$ -> Đúng: Tách $\frac{x+3}{x+1}=1+\frac{2}{x+1}$ rồi mới tính.

---

### 20. Khái niệm tích phân và tính chất

- ID: `c86fc36b-255a-5f57-9397-6ed940db94e5`
- Chủ đề: Nguyên hàm và tích phân
- Mức độ: `nhan_biet`
- Số bài tập: 10

## I. Công thức & định nghĩa cốt lõi

Tích phân xác định là một khái niệm quan trọng trong Giải tích lớp 12, thường xuất hiện trong các câu hỏi nhận biết và thông hiểu. Nếu hàm số $f(x)$ liên tục trên đoạn $[a;b]$ và $F(x)$ là một nguyên hàm của $f(x)$ trên đoạn đó, tức là $F'(x)=f(x)$, thì tích phân xác định của $f(x)$ từ $a$ đến $b$ được định nghĩa bởi công thức Newton–Leibniz:

$$\int_a^b f(x)\,dx = F(b)-F(a).$$

Trong đó, $a$ gọi là cận dưới, $b$ gọi là cận trên, $f(x)$ là hàm dưới dấu tích phân. Kết quả của tích phân xác định là một số, không còn phụ thuộc vào biến $x$.

Một số tính chất cơ bản cần nhớ:

1. Đổi cận đổi dấu:
$$\int_a^b f(x)\,dx = -\int_b^a f(x)\,dx.$$

2. Tích phân trên đoạn có hai cận bằng nhau:
$$\int_a^a f(x)\,dx=0.$$

3. Tính tuyến tính:
$$\int_a^b [m f(x)+n g(x)]\,dx = m\int_a^b f(x)\,dx+n\int_a^b g(x)\,dx.$$

4. Tính chất cộng đoạn:
$$\int_a^b f(x)\,dx = \int_a^c f(x)\,dx+\int_c^b f(x)\,dx,$$
với $c$ là điểm thuộc hoặc không thuộc đoạn, miễn các tích phân đều xác định.

5. Nếu $f(x)\ge 0$ trên $[a;b]$ thì $\int_a^b f(x)\,dx\ge 0$. Nếu $f(x)\le 0$ trên $[a;b]$ thì $\int_a^b f(x)\,dx\le 0$.

## II. Phương pháp làm nhanh

Với dạng nhận biết, học sinh cần đọc kỹ đề để xác định đang hỏi định nghĩa hay tính chất. Nếu đề cho $F(x)$ là nguyên hàm của $f(x)$, hãy dùng ngay:

$$\int_a^b f(x)\,dx=F(b)-F(a).$$

Nếu đề yêu cầu biến đổi biểu thức tích phân, hãy ưu tiên dùng các tính chất: đổi cận, tách tổng, đưa hằng số ra ngoài và cộng đoạn. Khi gặp biểu thức như $\int_b^a f(x)\,dx$, cần đổi về cận quen thuộc bằng cách thêm dấu trừ.

Một mẹo nhanh: tích phân xác định là “giá trị tại cận trên trừ giá trị tại cận dưới”. Vì vậy, nếu $F(x)$ là nguyên hàm thì không viết $F(a)-F(b)$, mà phải viết $F(b)-F(a)$.

Ngoài ra, không nên nhầm tích phân xác định với nguyên hàm. Nguyên hàm có dạng $F(x)+C$, còn tích phân xác định cho ra một số cụ thể nên không có $+C$.

## III. Ví dụ minh họa

**Ví dụ 1.** Biết $F(x)=x^3$ là một nguyên hàm của $f(x)=3x^2$. Tính $\int_1^2 3x^2\,dx$.

Ta có:

$$\int_1^2 3x^2\,dx=F(2)-F(1)=2^3-1^3=8-1=7.$$

Vậy $\int_1^2 3x^2\,dx=7$.

**Ví dụ 2.** Cho $\int_1^3 f(x)\,dx=5$. Tính $\int_3^1 f(x)\,dx$.

Áp dụng tính chất đổi cận:

$$\int_3^1 f(x)\,dx=-\int_1^3 f(x)\,dx=-5.$$

**Ví dụ 3.** Cho $\int_0^2 f(x)\,dx=4$ và $\int_0^2 g(x)\,dx=-1$. Tính $\int_0^2 [2f(x)-3g(x)]\,dx$.

Dùng tính tuyến tính:

$$\int_0^2 [2f(x)-3g(x)]\,dx=2\int_0^2 f(x)\,dx-3\int_0^2 g(x)\,dx.$$

Suy ra:

$$2\cdot 4-3\cdot (-1)=8+3=11.$$

## IV. Chú ý tránh sai

Thứ nhất, khi dùng công thức Newton–Leibniz, phải lấy giá trị nguyên hàm tại cận trên trừ giá trị tại cận dưới. Viết ngược thứ tự sẽ sai dấu.

Thứ hai, khi đổi cận tích phân, bắt buộc đổi dấu. Đây là lỗi rất hay gặp trong câu hỏi nhận biết.

Thứ ba, không thêm hằng số $C$ vào kết quả tích phân xác định. Hằng số $C$ chỉ xuất hiện khi tìm nguyên hàm hoặc tích phân không xác định.

Thứ tư, hằng số nhân có thể đưa ra ngoài dấu tích phân, nhưng cận tích phân phải giữ nguyên nếu không có phép đổi biến hoặc đổi cận hợp lệ.

Cuối cùng, cần nhớ tích phân xác định phụ thuộc vào hàm số và hai cận, không phụ thuộc vào tên biến. Ví dụ:

$$\int_a^b f(x)\,dx=\int_a^b f(t)\,dt.$$

Hai biểu thức trên có cùng giá trị.

#### Quy tắc chính

- Nếu $F'(x)=f(x)$ thì $\int_a^b f(x)\,dx=F(b)-F(a)$.
- Đổi cận tích phân thì đổi dấu.
- Tích phân xác định cho kết quả là một số, không có $+C$.
- Có thể tách tổng, hiệu và đưa hằng số ra ngoài dấu tích phân.
- Tích phân trên hai cận bằng nhau luôn bằng $0$.

#### Lỗi thường gặp

- Sai: Viết $\int_a^b f(x)\,dx=F(a)-F(b)$ -> Đúng: $\int_a^b f(x)\,dx=F(b)-F(a)$.
- Sai: Đổi $\int_b^a f(x)\,dx$ thành $\int_a^b f(x)\,dx$ mà không đổi dấu -> Đúng: $\int_b^a f(x)\,dx=-\int_a^b f(x)\,dx$.
- Sai: Thêm $+C$ vào tích phân xác định -> Đúng: Chỉ thêm $+C$ khi tìm nguyên hàm.
- Sai: Cho rằng $\int_a^a f(x)\,dx=f(a)$ -> Đúng: $\int_a^a f(x)\,dx=0$.

---

### 21. Ứng dụng tích phân tính diện tích hình phẳng

- ID: `19448819-2471-5cf8-934f-c30cac0cab98`
- Chủ đề: Nguyên hàm và tích phân
- Mức độ: `thong_hieu`
- Số bài tập: 10

## I. Công thức & định nghĩa cốt lõi

Diện tích hình phẳng giới hạn bởi các đường cong là một ứng dụng quan trọng của tích phân trong chương trình Toán THPT. Ý tưởng chính: tích phân biểu diễn “tổng vô hạn” các lát mỏng, còn diện tích luôn không âm.

Nếu hình phẳng được giới hạn bởi đồ thị $y=f(x)$, trục hoành và hai đường thẳng $x=a$, $x=b$, thì diện tích là

$$S=\int_a^b |f(x)|\,dx.$$

Nếu trên đoạn $[a;b]$ ta có $f(x)\ge 0$, khi đó

$$S=\int_a^b f(x)\,dx.$$

Nếu $f(x)\le 0$, khi đó

$$S=-\int_a^b f(x)\,dx.$$

Với hai đồ thị $y=f(x)$ và $y=g(x)$ giới hạn một hình phẳng trên đoạn $[a;b]$, diện tích là

$$S=\int_a^b |f(x)-g(x)|\,dx.$$

Nếu biết chắc $f(x)\ge g(x)$ trên $[a;b]$, ta dùng công thức nhanh:

$$S=\int_a^b [f(x)-g(x)]\,dx.$$

Ngược lại, nếu $g(x)\ge f(x)$ thì

$$S=\int_a^b [g(x)-f(x)]\,dx.$$

Trong nhiều bài toán, hai cận $a,b$ không cho sẵn. Khi đó ta phải tìm giao điểm bằng cách giải phương trình $f(x)=g(x)$. Các nghiệm tìm được chính là hoành độ giao điểm, thường dùng làm cận tích phân.

## II. Phương pháp làm nhanh

Bước 1: Xác định các đường giới hạn hình phẳng. Cần đọc kỹ đề xem hình được giới hạn bởi đồ thị nào, trục nào, hay các đường thẳng nào.

Bước 2: Tìm cận tích phân. Nếu đề cho rõ $x=a$, $x=b$ thì dùng ngay. Nếu chưa cho, giải phương trình giao điểm. Ví dụ, với hai đồ thị $y=f(x)$ và $y=g(x)$, ta giải $f(x)=g(x)$.

Bước 3: Xác định đường trên và đường dưới. Trên mỗi khoảng, so sánh $f(x)$ và $g(x)$. Có thể chọn một giá trị thử trong khoảng để biết hàm nào lớn hơn.

Bước 4: Lập tích phân diện tích. Công thức thường dùng nhất là

$$S=\int_a^b (\text{hàm trên}-\text{hàm dưới})\,dx.$$

Bước 5: Nếu hai đồ thị cắt nhau nhiều lần, phải chia đoạn tích phân theo các giao điểm. Khi đó:

$$S=\int_{x_1}^{x_2}|f(x)-g(x)|\,dx+\int_{x_2}^{x_3}|f(x)-g(x)|\,dx+\cdots.$$

Không nên bỏ dấu giá trị tuyệt đối nếu chưa biết rõ hàm nào nằm trên.

## III. Ví dụ minh họa

**Ví dụ 1.** Tính diện tích hình phẳng giới hạn bởi parabol $y=x^2$ và đường thẳng $y=2x$.

Ta tìm giao điểm:

$$x^2=2x \Leftrightarrow x(x-2)=0 \Leftrightarrow x=0 \text{ hoặc } x=2.$$

Vậy hai cận là $0$ và $2$. Trên đoạn $[0;2]$, chọn $x=1$, ta có $2x=2$ và $x^2=1$, nên đường thẳng $y=2x$ nằm trên parabol $y=x^2$.

Diện tích cần tìm:

$$S=\int_0^2 (2x-x^2)\,dx.$$

Tính tích phân:

$$S=\left[x^2-\frac{x^3}{3}\right]_0^2=4-\frac{8}{3}=\frac{4}{3}.$$

Vậy diện tích hình phẳng là $S=\frac{4}{3}$.

**Ví dụ 2.** Tính diện tích hình phẳng giới hạn bởi đồ thị $y=x^2-4$ và trục hoành.

Ta giải phương trình giao điểm với trục hoành:

$$x^2-4=0 \Leftrightarrow x=-2 \text{ hoặc } x=2.$$

Trên đoạn $[-2;2]$, ta có $x^2-4\le 0$. Vì đồ thị nằm dưới trục hoành nên diện tích là

$$S=\int_{-2}^{2}|x^2-4|\,dx=\int_{-2}^{2}(4-x^2)\,dx.$$

Do hàm $4-x^2$ là hàm chẵn, có thể tính nhanh:

$$S=2\int_0^2(4-x^2)\,dx=2\left[4x-\frac{x^3}{3}\right]_0^2=2\left(8-\frac{8}{3}\right)=\frac{32}{3}.$$

Vậy $S=\frac{32}{3}$.

## IV. Chú ý tránh sai

Diện tích không bao giờ âm. Nếu tính ra kết quả âm, chắc chắn đã sai ở bước xác định hàm trên - hàm dưới hoặc quên dấu giá trị tuyệt đối.

Khi hai đồ thị cắt nhau nhiều điểm, không được lấy tích phân một lần trên toàn đoạn rồi bỏ qua sự đổi vị trí trên dưới. Cần chia đoạn theo các giao điểm.

Nếu hình phẳng giới hạn bởi trục hoành, hãy xét dấu của hàm số. Nếu đồ thị nằm dưới trục hoành thì phải lấy đối của tích phân hoặc dùng $|f(x)|$.

Trong bài thi, nên vẽ phác đồ thị hoặc lập bảng xét dấu nhanh. Việc này giúp tránh nhầm cận và nhầm hàm trên - hàm dưới.

#### Quy tắc chính

- Diện tích luôn không âm, nên phải dùng giá trị tuyệt đối khi cần.
- Hai đồ thị giới hạn diện tích: lấy tích phân của hàm trên trừ hàm dưới.
- Cận tích phân thường là hoành độ giao điểm của các đường cong.
- Nếu vị trí trên dưới thay đổi, phải chia đoạn tích phân.
- Với trục hoành, cần xét dấu của hàm số trước khi bỏ dấu giá trị tuyệt đối.

#### Lỗi thường gặp

- Sai: Lấy $\int_a^b f(x)\,dx$ làm diện tích dù $f(x)$ âm -> Đúng: Dùng $\int_a^b |f(x)|\,dx$ hoặc đổi dấu trên khoảng âm.
- Sai: Không giải phương trình giao điểm mà chọn cận theo cảm tính -> Đúng: Tìm cận bằng cách giải $f(x)=g(x)$.
- Sai: Tính $\int_a^b [f(x)-g(x)]\,dx$ khi chưa biết hàm nào ở trên -> Đúng: So sánh hai hàm hoặc dùng $|f(x)-g(x)|$.
- Sai: Hai đồ thị cắt nhau nhiều lần nhưng chỉ tính một tích phân duy nhất -> Đúng: Chia đoạn theo từng giao điểm rồi cộng các diện tích nhỏ.

---

### 22. Ứng dụng tích phân tính thể tích vật thể tròn xoay

- ID: `17ccb059-9129-59e6-87f3-a9aa14e97e9f`
- Chủ đề: Nguyên hàm và tích phân
- Mức độ: `thong_hieu`
- Số bài tập: 10

## I. Công thức & định nghĩa cốt lõi

Vật thể tròn xoay được tạo ra khi ta quay một hình phẳng quanh một trục cố định, thường là trục $Ox$ hoặc $Oy$. Trong chương trình THPT, dạng hay gặp nhất là hình phẳng giới hạn bởi đồ thị hàm số, trục tọa độ và các đường thẳng $x=a, x=b$ hoặc $y=c, y=d$.

Nếu hình phẳng giới hạn bởi $y=f(x)$, trục $Ox$, hai đường thẳng $x=a, x=b$ và quay quanh trục $Ox$, thể tích là

$$V=\pi\int_a^b [f(x)]^2\,dx.$$

Nếu hình phẳng nằm giữa hai đồ thị $y=f(x)$ và $y=g(x)$, quay quanh trục $Ox$, thể tích tính theo phương pháp vành khăn:

$$V=\pi\int_a^b \left(R^2-r^2\right)dx,$$

trong đó $R$ là bán kính ngoài, $r$ là bán kính trong, đều là khoảng cách từ đồ thị đến trục quay $Ox$.

Tương tự, nếu quay quanh trục $Oy$ và biểu diễn được theo biến $y$, chẳng hạn $x=\varphi(y)$ trên đoạn $[c,d]$, thì

$$V=\pi\int_c^d [\varphi(y)]^2\,dy.$$

Khi hình phẳng nằm giữa $x=\varphi(y)$ và $x=\psi(y)$, quay quanh $Oy$, ta dùng

$$V=\pi\int_c^d \left(R^2-r^2\right)dy.$$

Điểm quan trọng: bán kính luôn là khoảng cách vuông góc từ miền quay đến trục quay, không nhất thiết bằng trực tiếp hàm số nếu trục quay không phải $Ox$ hoặc $Oy$.

## II. Phương pháp làm nhanh

Bước 1: Xác định miền phẳng cần quay. Gạch chân các đường giới hạn: đồ thị nào, trục nào, đường thẳng nào. Nếu đề chưa cho cận rõ ràng, hãy tìm giao điểm bằng cách giải phương trình.

Bước 2: Xác định trục quay. Nếu quay quanh $Ox$, thường tích phân theo $x$; nếu quay quanh $Oy$, thường tích phân theo $y$. Cách chọn biến đúng giúp công thức gọn và tránh phải đổi phức tạp.

Bước 3: Tìm bán kính. Với quay quanh $Ox$, bán kính là khoảng cách theo phương thẳng đứng, thường liên quan đến $y$. Với quay quanh $Oy$, bán kính là khoảng cách theo phương ngang, thường liên quan đến $x$.

Bước 4: Chọn công thức đĩa hay vành khăn. Nếu miền quay sát trục quay, không có lỗ rỗng ở giữa, dùng công thức đĩa: $V=\pi\int R^2$. Nếu miền không sát trục quay hoặc nằm giữa hai đường, dùng vành khăn: $V=\pi\int(R^2-r^2)$.

Bước 5: Tính tích phân và kết luận đơn vị thể tích. Khi bình phương hàm số, cần đặt ngoặc cẩn thận, đặc biệt với biểu thức dạng $f(x)-g(x)$ hoặc $a-x^2$.

## III. Ví dụ minh họa

Ví dụ 1. Tính thể tích vật thể tạo thành khi quay hình phẳng giới hạn bởi $y=x^2$, trục $Ox$, $x=0$, $x=2$ quanh trục $Ox$.

Miền phẳng sát trục $Ox$, nên dùng công thức đĩa. Bán kính là $R=x^2$. Do đó

$$V=\pi\int_0^2 (x^2)^2dx=\pi\int_0^2 x^4dx=\pi\left.\frac{x^5}{5}\right|_0^2=\frac{32\pi}{5}.$$

Vậy thể tích là $\frac{32\pi}{5}$.

Ví dụ 2. Tính thể tích khi quay hình phẳng giới hạn bởi $y=4-x^2$ và $y=0$ quanh trục $Ox$.

Ta tìm giao điểm với $Ox$: $4-x^2=0\Rightarrow x=\pm2$. Miền nằm từ $x=-2$ đến $x=2$, sát trục $Ox$. Bán kính là $R=4-x^2$.

$$V=\pi\int_{-2}^{2}(4-x^2)^2dx.$$

Khai triển:

$$(4-x^2)^2=16-8x^2+x^4.$$

Do đó

$$V=\pi\int_{-2}^{2}(16-8x^2+x^4)dx=\pi\left[16x-\frac{8x^3}{3}+\frac{x^5}{5}\right]_{-2}^{2}=\frac{512\pi}{15}.$$

Ví dụ 3. Hình phẳng giới hạn bởi $x=y^2$, trục $Oy$, $y=0$, $y=1$ quay quanh $Oy$.

Vì quay quanh $Oy$, ta tính theo $y$. Bán kính là $R=y^2$. Suy ra

$$V=\pi\int_0^1 (y^2)^2dy=\pi\int_0^1 y^4dy=\frac{\pi}{5}.$$

## IV. Chú ý tránh sai

Không được quên bình phương bán kính. Công thức thể tích không phải $\pi\int f(x)dx$ mà là $\pi\int [f(x)]^2dx$.

Không phải lúc nào cận tích phân cũng được cho sẵn. Nếu hình phẳng giới hạn bởi hai đồ thị, cần tìm giao điểm để xác định cận.

Khi dùng công thức vành khăn, phải lấy bình phương bán kính ngoài trừ bình phương bán kính trong: $R^2-r^2$, không phải $(R-r)^2$.

Nếu quay quanh $Oy$, nên đổi phương trình về dạng $x$ theo $y$ nếu cần. Nhiều học sinh nhầm vẫn tích phân theo $x$ như khi quay quanh $Ox$, dẫn đến sai bán kính và sai cận.

#### Quy tắc chính

- Quay quanh $Ox$ thường tích phân theo $x$ với bán kính là khoảng cách theo phương đứng.
- Quay quanh $Oy$ thường tích phân theo $y$ với bán kính là khoảng cách theo phương ngang.
- Miền sát trục quay dùng công thức đĩa: $V=\pi\int R^2$.
- Miền có lỗ rỗng dùng vành khăn: $V=\pi\int(R^2-r^2)$.
- Luôn tìm giao điểm để xác định đúng cận tích phân.

#### Lỗi thường gặp

- Sai: Dùng $V=\pi\int f(x)dx$ -> Đúng: Dùng $V=\pi\int [f(x)]^2dx$.
- Sai: Lấy vành khăn là $(R-r)^2$ -> Đúng: Phải lấy $R^2-r^2$.
- Sai: Quay quanh $Oy$ nhưng vẫn dùng bán kính theo $y=f(x)$ -> Đúng: Cần xét khoảng cách ngang, thường viết $x$ theo $y$.
- Sai: Lấy cận theo cảm tính -> Đúng: Giải phương trình giao điểm để xác định cận chính xác.

---

### 23. Ứng dụng thực tế của tích phân

- ID: `d62ae14d-b20f-5f03-aee0-834bd73066cc`
- Chủ đề: Nguyên hàm và tích phân
- Mức độ: `van_dung`
- Số bài tập: 10

## I. Công thức & định nghĩa cốt lõi

Tích phân xác định không chỉ dùng để tính diện tích mà còn mô tả nhiều đại lượng thực tế được “tích lũy” theo thời gian, quãng đường, thể tích hoặc lực.

**1. Quãng đường từ vận tốc**

Nếu vật chuyển động trên một trục với vận tốc $v(t)$, thì độ dời từ thời điểm $a$ đến $b$ là:

$$\Delta s=s(b)-s(a)=\int_a^b v(t)\,dt.$$

Nếu $v(t)\ge 0$ trên $[a,b]$, quãng đường đi được là:

$$S=\int_a^b v(t)\,dt.$$

Nếu $v(t)$ có thể âm, quãng đường thực tế là:

$$S=\int_a^b |v(t)|\,dt.$$

Nói cách khác, độ dời có xét chiều, còn quãng đường luôn không âm.

**2. Công của lực biến thiên**

Nếu một lực $F(x)$ tác dụng lên vật theo phương chuyển động khi vật đi từ $x=a$ đến $x=b$, công sinh ra là:

$$A=\int_a^b F(x)\,dx.$$

Đơn vị thường gặp: nếu $F$ tính bằng Newton và $x$ tính bằng mét thì công $A$ tính bằng Joule.

**3. Lưu lượng và thể tích**

Nếu $q(t)$ là lưu lượng chất lỏng tại thời điểm $t$, tức lượng chất lỏng chảy qua trong một đơn vị thời gian, thì thể tích chảy qua từ $a$ đến $b$ là:

$$V=\int_a^b q(t)\,dt.$$

Ví dụ $q(t)$ tính bằng lít/phút, $t$ tính bằng phút thì $V$ tính bằng lít.

## II. Phương pháp làm nhanh

Bước 1: Xác định đại lượng cần tính là độ dời, quãng đường, công hay thể tích.

Bước 2: Tìm hàm tốc độ biến thiên tương ứng. Với chuyển động là $v(t)$, với công là $F(x)$, với lưu lượng là $q(t)$.

Bước 3: Xác định đúng cận tích phân. Cận phải cùng biến với hàm: thời gian thì dùng $t$, vị trí thì dùng $x$.

Bước 4: Lập tích phân theo mẫu:

$$\text{Đại lượng tích lũy}=\int_{\text{cận đầu}}^{\text{cận cuối}} \text{tốc độ biến thiên}\,d(\text{biến}).$$

Bước 5: Tính tích phân và kiểm tra đơn vị. Trong bài thực tế, đơn vị là dấu hiệu rất quan trọng để phát hiện sai công thức.

Với bài quãng đường, cần đặc biệt kiểm tra dấu của $v(t)$. Nếu đề hỏi “độ dời”, dùng $\int v(t)dt$. Nếu đề hỏi “quãng đường”, phải dùng $\int |v(t)|dt$. Khi $v(t)$ đổi dấu, ta tìm nghiệm $v(t)=0$ trong khoảng rồi chia khoảng tích phân.

## III. Ví dụ minh họa

**Ví dụ 1.** Một vật chuyển động với vận tốc $v(t)=3t^2-12t+9$ m/s trong khoảng $0\le t\le 4$. Tính độ dời và quãng đường đi được.

Ta có:

$$\Delta s=\int_0^4 (3t^2-12t+9)\,dt.$$

Nguyên hàm là $t^3-6t^2+9t$, nên:

$$\Delta s=(64-96+36)-0=4\text{ m}.$$

Để tính quãng đường, xét dấu $v(t)$:

$$3t^2-12t+9=3(t-1)(t-3).$$

Vận tốc dương trên $[0,1]$, âm trên $[1,3]$, dương trên $[3,4]$. Do đó:

$$S=\int_0^1 v(t)dt-\int_1^3 v(t)dt+\int_3^4 v(t)dt.$$

Đặt $F(t)=t^3-6t^2+9t$. Khi đó $F(0)=0$, $F(1)=4$, $F(3)=0$, $F(4)=4$. Suy ra:

$$S=(4-0)-(0-4)+(4-0)=12\text{ m}.$$

**Ví dụ 2.** Một máy bơm có lưu lượng $q(t)=2t+5$ lít/phút trong $0\le t\le 10$. Thể tích nước bơm được là:

$$V=\int_0^{10}(2t+5)dt=[t^2+5t]_0^{10}=150\text{ lít}.$$

**Ví dụ 3.** Một lực kéo biến thiên theo vị trí $F(x)=4x+3$ Newton khi vật đi từ $x=0$ đến $x=5$ mét. Công của lực là:

$$A=\int_0^5(4x+3)dx=[2x^2+3x]_0^5=65\text{ J}.$$

## IV. Chú ý tránh sai

Thứ nhất, không đồng nhất độ dời và quãng đường. Nếu vận tốc âm ở một đoạn nào đó, tích phân $\int v(t)dt$ có thể bị triệt tiêu một phần, nên không phản ánh tổng độ dài đường đi.

Thứ hai, luôn kiểm tra biến số. Công thức công dùng $F(x)dx$, không dùng $F(t)dt$ nếu lực được cho theo vị trí. Lưu lượng theo thời gian thì tích phân theo $dt$.

Thứ ba, đơn vị phải khớp. Nếu vận tốc tính bằng km/h mà thời gian tính bằng phút, cần đổi phút sang giờ trước khi tích phân hoặc đổi đơn vị vận tốc cho phù hợp.

Thứ tư, khi bài cho đồ thị, diện tích phía dưới trục hoành mang dấu âm nếu tính độ dời, nhưng khi tính quãng đường phải lấy giá trị dương của diện tích đó.

#### Quy tắc chính

- Độ dời bằng $\int_a^b v(t)dt$, quãng đường bằng $\int_a^b |v(t)|dt$.
- Công của lực biến thiên theo vị trí: $A=\int_a^b F(x)dx$.
- Thể tích từ lưu lượng: $V=\int_a^b q(t)dt$.
- Luôn xác định đúng cận, đúng biến và đúng đơn vị trước khi tính.
- Nếu hàm đổi dấu, phải chia khoảng theo nghiệm của hàm.

#### Lỗi thường gặp

- Sai: Dùng $\int v(t)dt$ để tính quãng đường khi $v(t)$ đổi dấu -> Đúng: Dùng $\int |v(t)|dt$ và chia khoảng theo nghiệm $v(t)=0$.
- Sai: Quên đổi đơn vị thời gian, ví dụ phút và giờ lẫn lộn -> Đúng: Đổi về cùng hệ đơn vị trước khi lập tích phân.
- Sai: Nhầm công thức công với thời gian, viết $\int F(x)dt$ -> Đúng: Nếu lực phụ thuộc vị trí thì dùng $\int F(x)dx$.
- Sai: Lấy diện tích âm trên đồ thị khi tính quãng đường -> Đúng: Quãng đường là tổng các diện tích lấy dương.

---

## Chương 5: Vectơ và tọa độ Oxyz nền tảng

- Môn: `toan_hinh`
- Số bài: 6

### 24. Tọa độ điểm và tọa độ vectơ trong Oxyz

- ID: `086f9cb3-95ff-53fc-a9e2-1b10e0349899`
- Chủ đề: Vectơ và tọa độ Oxyz
- Mức độ: `nhan_biet`
- Số bài tập: 10

## I. Công thức & định nghĩa cốt lõi

Trong không gian, hệ trục tọa độ vuông góc $Oxyz$ gồm ba trục đôi một vuông góc: $Ox$, $Oy$, $Oz$, có chung gốc $O$. Ba vectơ đơn vị trên các trục lần lượt là $\vec{i}$, $\vec{j}$, $\vec{k}$.

Một điểm $M$ trong không gian có tọa độ $M(x;y;z)$ nghĩa là từ gốc $O$, ta đi theo trục $Ox$ một đoạn có tọa độ $x$, theo trục $Oy$ một đoạn có tọa độ $y$, và theo trục $Oz$ một đoạn có tọa độ $z$. Khi đó vectơ vị trí của điểm $M$ là

$$\overrightarrow{OM}=x\vec{i}+y\vec{j}+z\vec{k}.$$

Nếu $A(x_A;y_A;z_A)$ và $B(x_B;y_B;z_B)$ thì tọa độ vectơ $\overrightarrow{AB}$ được tính bởi

$$\overrightarrow{AB}=(x_B-x_A;\ y_B-y_A;\ z_B-z_A).$$

Vectơ $\vec{u}=(a;b;c)$ có nghĩa là

$$\vec{u}=a\vec{i}+b\vec{j}+c\vec{k}.$$

Hai vectơ bằng nhau khi và chỉ khi các tọa độ tương ứng bằng nhau:

$$\vec{u}=(a;b;c),\ \vec{v}=(a';b';c') \Rightarrow \vec{u}=\vec{v} \Leftrightarrow a=a',\ b=b',\ c=c'.$$

Độ dài vectơ $\vec{u}=(a;b;c)$ là

$$|\vec{u}|=\sqrt{a^2+b^2+c^2}.$$

Độ dài đoạn thẳng $AB$ chính là độ dài vectơ $\overrightarrow{AB}$:

$$AB=\sqrt{(x_B-x_A)^2+(y_B-y_A)^2+(z_B-z_A)^2}.$$

## II. Phương pháp làm nhanh

Với dạng nhận biết, mục tiêu chính là đọc đúng tọa độ điểm, xác định đúng tọa độ vectơ và phân biệt điểm với vectơ.

Bước 1: Xác định đối tượng đề hỏi là điểm hay vectơ. Nếu hỏi tọa độ điểm $M$, ta viết $M(x;y;z)$. Nếu hỏi tọa độ vectơ $\vec{u}$, ta viết $\vec{u}=(a;b;c)$.

Bước 2: Nếu vectơ có dạng $\overrightarrow{AB}$, luôn lấy tọa độ điểm cuối trừ tọa độ điểm đầu:

$$\overrightarrow{AB}=B-A.$$

Cụ thể, lấy hoành độ trừ hoành độ, tung độ trừ tung độ, cao độ trừ cao độ.

Bước 3: Nếu đề cho biểu thức dạng $\vec{u}=a\vec{i}+b\vec{j}+c\vec{k}$, tọa độ của $\vec{u}$ là $(a;b;c)$. Ngược lại, nếu $\vec{u}=(a;b;c)$ thì viết được $\vec{u}=a\vec{i}+b\vec{j}+c\vec{k}$.

Bước 4: Nếu cần độ dài, bình phương từng tọa độ rồi cộng lại dưới căn. Với đoạn thẳng $AB$, trước hết tìm $\overrightarrow{AB}$, sau đó lấy độ dài.

## III. Ví dụ minh họa

Ví dụ 1. Cho $A(1;2;-3)$, $B(4;-1;5)$. Tìm tọa độ $\overrightarrow{AB}$.

Ta lấy tọa độ điểm cuối $B$ trừ tọa độ điểm đầu $A$:

$$\overrightarrow{AB}=(4-1;\ -1-2;\ 5-(-3))=(3;-3;8).$$

Vậy $\overrightarrow{AB}=(3;-3;8)$.

Ví dụ 2. Cho $\vec{u}=2\vec{i}-3\vec{j}+5\vec{k}$. Tọa độ của $\vec{u}$ là gì?

Ta đọc trực tiếp hệ số của $\vec{i},\vec{j},\vec{k}$. Do đó

$$\vec{u}=(2;-3;5).$$

Ví dụ 3. Cho $M(-2;0;4)$. Viết tọa độ vectơ $\overrightarrow{OM}$.

Vì $O(0;0;0)$ nên

$$\overrightarrow{OM}=(-2-0;\ 0-0;\ 4-0)=(-2;0;4).$$

Như vậy tọa độ của điểm $M$ và tọa độ vectơ $\overrightarrow{OM}$ có cùng bộ số, nhưng bản chất khác nhau: $M$ là điểm, còn $\overrightarrow{OM}$ là vectơ.

Ví dụ 4. Tính độ dài vectơ $\vec{v}=(-1;2;2)$.

Áp dụng công thức:

$$|\vec{v}|=\sqrt{(-1)^2+2^2+2^2}=\sqrt{1+4+4}=3.$$

## IV. Chú ý tránh sai

Không được nhầm thứ tự tọa độ trong không gian. Luôn viết theo thứ tự $(x;y;z)$, tương ứng với ba trục $Ox,Oy,Oz$.

Khi tính $\overrightarrow{AB}$, điểm đầu là $A$, điểm cuối là $B$, nên công thức là $B-A$, không phải $A-B$. Nếu đảo thứ tự, vectơ sẽ đổi dấu.

Cần phân biệt tọa độ điểm và tọa độ vectơ. Điểm thường viết $A(x;y;z)$, còn vectơ viết $\vec{u}=(a;b;c)$. Dù hình thức gần giống nhau, ý nghĩa toán học khác nhau.

Khi gặp số âm, phải đặt ngoặc cẩn thận, đặc biệt trong phép trừ như $5-(-3)=8$. Đây là lỗi rất thường gặp trong bài nhận biết.

Khi tính độ dài, không cộng trực tiếp các tọa độ. Phải bình phương từng tọa độ rồi mới cộng và lấy căn.

#### Quy tắc chính

- Tọa độ điểm trong Oxyz luôn viết theo thứ tự $(x;y;z)$.
- Tọa độ $\overrightarrow{AB}$ bằng tọa độ điểm cuối trừ tọa độ điểm đầu.
- Nếu $\vec{u}=a\vec{i}+b\vec{j}+c\vec{k}$ thì $\vec{u}=(a;b;c)$.
- Độ dài $\vec{u}=(a;b;c)$ là $\sqrt{a^2+b^2+c^2}$.
- Điểm $M(x;y;z)$ và vectơ $\overrightarrow{OM}=(x;y;z)$ có cùng bộ số nhưng khác bản chất.

#### Lỗi thường gặp

- Sai: Tính $\overrightarrow{AB}=A-B$ -> Đúng: $\overrightarrow{AB}=B-A$.
- Sai: Đọc $2\vec{i}-3\vec{j}+5\vec{k}$ thành $(2;3;5)$ -> Đúng: $(2;-3;5)$.
- Sai: Nhầm điểm $A(1;2;3)$ là vectơ -> Đúng: $A$ là điểm, còn $\overrightarrow{OA}=(1;2;3)$ là vectơ.
- Sai: Tính $|\vec{u}|=a+b+c$ -> Đúng: $|\vec{u}|=\sqrt{a^2+b^2+c^2}$.

---

### 25. Các phép toán vectơ cơ bản

- ID: `8d6f9a62-5ff2-58ac-8f3b-3b3d39b3f6dd`
- Chủ đề: Vectơ và tọa độ Oxyz
- Mức độ: `nhan_biet`
- Số bài tập: 10

## I. Công thức & định nghĩa cốt lõi

Trong hình học vectơ, một vectơ được xác định bởi **hướng**, **chiều** và **độ dài**. Vectơ có điểm đầu $A$, điểm cuối $B$ được kí hiệu là $\overrightarrow{AB}$. Hai vectơ bằng nhau khi chúng cùng hướng và cùng độ dài, không nhất thiết phải có cùng điểm đặt.

**1. Cộng hai vectơ**

Với hai vectơ $\vec a$ và $\vec b$, tổng $\vec a+\vec b$ là một vectơ mới. Có hai cách nhận biết cơ bản:

- **Quy tắc ba điểm:** Với ba điểm $A,B,C$, ta có
$$\overrightarrow{AB}+\overrightarrow{BC}=\overrightarrow{AC}.$$
Điểm cuối của vectơ thứ nhất trùng với điểm đầu của vectơ thứ hai.

- **Quy tắc hình bình hành:** Nếu $\vec a=\overrightarrow{AB}$, $\vec b=\overrightarrow{AD}$ và $ABCD$ là hình bình hành thì
$$\overrightarrow{AB}+\overrightarrow{AD}=\overrightarrow{AC}.$$
Tổng hai vectơ là đường chéo xuất phát từ cùng gốc.

**2. Trừ hai vectơ**

Hiệu $\vec a-\vec b$ được hiểu là
$$\vec a-\vec b=\vec a+(-\vec b).$$
Vectơ $-\vec b$ là vectơ đối của $\vec b$, có cùng độ dài nhưng ngược chiều với $\vec b$.

Một công thức rất hay dùng là:
$$\overrightarrow{AB}-\overrightarrow{AC}=\overrightarrow{CB}.$$
Ngoài ra, với cùng điểm đầu $O$:
$$\overrightarrow{OA}-\overrightarrow{OB}=\overrightarrow{BA}.$$

**3. Nhân vectơ với một số**

Với số thực $k$ và vectơ $\vec a$, tích $k\vec a$ là một vectơ có:

- Cùng hướng với $\vec a$ nếu $k>0$.
- Ngược hướng với $\vec a$ nếu $k<0$.
- Độ dài bằng $|k|\cdot |\vec a|$.
- Nếu $k=0$ hoặc $\vec a=\vec 0$ thì $k\vec a=\vec 0$.

Ví dụ: $2\vec a$ cùng hướng với $\vec a$ và dài gấp đôi; $-3\vec a$ ngược hướng với $\vec a$ và dài gấp ba.

## II. Phương pháp làm nhanh

Ở mức độ nhận biết, điều quan trọng nhất là nhìn ra **dạng quen thuộc** của phép toán. Khi gặp tổng kiểu $\overrightarrow{AB}+\overrightarrow{BC}$, hãy kiểm tra xem điểm cuối của vectơ thứ nhất có trùng điểm đầu của vectơ thứ hai không. Nếu có, áp dụng ngay quy tắc ba điểm để được $\overrightarrow{AC}$.

Khi gặp hiệu hai vectơ, nên đổi về phép cộng với vectơ đối hoặc dùng công thức có sẵn. Chẳng hạn:
$$\overrightarrow{AB}-\overrightarrow{AC}=\overrightarrow{CB}.$$
Mẹo nhớ: hai vectơ có cùng điểm đầu $A$, kết quả là vectơ nối từ điểm cuối của vectơ bị trừ đến điểm cuối của vectơ đứng trước.

Với phép nhân vectơ với một số, chỉ cần xét dấu và giá trị tuyệt đối của số đó. Số dương giữ nguyên chiều, số âm đổi chiều, số $0$ cho vectơ không. Độ dài luôn nhân với $|k|$, không nhân với $k$ nếu $k$ âm.

Nếu bài có hình bình hành, hãy nghĩ ngay đến quy tắc hình bình hành. Nếu hai vectơ cùng xuất phát từ một điểm, tổng của chúng thường là đường chéo hình bình hành. Nếu các vectơ đặt liên tiếp đầu cuối, tổng thường là vectơ đi từ điểm đầu tiên đến điểm cuối cùng.

## III. Ví dụ minh họa

**Ví dụ 1.** Rút gọn $\overrightarrow{AB}+\overrightarrow{BC}$.

Ta thấy điểm cuối của $\overrightarrow{AB}$ là $B$, trùng với điểm đầu của $\overrightarrow{BC}$. Áp dụng quy tắc ba điểm:
$$\overrightarrow{AB}+\overrightarrow{BC}=\overrightarrow{AC}.$$

**Ví dụ 2.** Rút gọn $\overrightarrow{AB}-\overrightarrow{AC}$.

Hai vectơ có cùng điểm đầu $A$. Dùng công thức hiệu:
$$\overrightarrow{AB}-\overrightarrow{AC}=\overrightarrow{CB}.$$
Kết quả là vectơ đi từ $C$ đến $B$.

**Ví dụ 3.** Cho $ABCD$ là hình bình hành. Tính $\overrightarrow{AB}+\overrightarrow{AD}$.

Trong hình bình hành, hai vectơ $\overrightarrow{AB}$ và $\overrightarrow{AD}$ cùng xuất phát từ $A$. Tổng của chúng là đường chéo từ $A$ đến $C$:
$$\overrightarrow{AB}+\overrightarrow{AD}=\overrightarrow{AC}.$$

**Ví dụ 4.** Nếu $|\vec a|=5$, hãy xác định độ dài và chiều của $-2\vec a$ so với $\vec a$.

Vì hệ số $-2<0$ nên $-2\vec a$ ngược chiều với $\vec a$. Độ dài là:
$$|-2\vec a|=|-2|\cdot |\vec a|=2\cdot 5=10.$$

## IV. Chú ý tránh sai

Không được cộng độ dài thay cho cộng vectơ. Vectơ có hướng và chiều, nên $|\vec a+\vec b|$ không nhất thiết bằng $|\vec a|+|\vec b|$.

Khi trừ vectơ, cần chú ý thứ tự. Hai kết quả $\overrightarrow{AB}-\overrightarrow{AC}$ và $\overrightarrow{AC}-\overrightarrow{AB}$ là hai vectơ đối nhau, không giống nhau.

Khi nhân với số âm, nhiều học sinh chỉ nhân độ dài mà quên đổi chiều. Ví dụ $-\vec a$ không cùng chiều với $\vec a$, mà ngược chiều và cùng độ dài.

Cuối cùng, cần phân biệt vectơ không $\vec 0$ với số $0$. Vectơ không không có hướng xác định và có độ dài bằng $0$.

#### Quy tắc chính

- $\overrightarrow{AB}+\overrightarrow{BC}=\overrightarrow{AC}$ theo quy tắc ba điểm.
- $\vec a-\vec b=\vec a+(-\vec b)$.
- $\overrightarrow{AB}-\overrightarrow{AC}=\overrightarrow{CB}$.
- $k\vec a$ cùng chiều với $\vec a$ nếu $k>0$, ngược chiều nếu $k<0$.
- Độ dài của $k\vec a$ là $|k|\cdot |\vec a|$.

#### Lỗi thường gặp

- Sai: Cộng vectơ bằng cách cộng độ dài -> Đúng: Phải dùng quy tắc ba điểm hoặc hình bình hành.
- Sai: $\overrightarrow{AB}-\overrightarrow{AC}=\overrightarrow{BC}$ -> Đúng: $\overrightarrow{AB}-\overrightarrow{AC}=\overrightarrow{CB}$.
- Sai: Nhân với số âm nhưng giữ nguyên chiều vectơ -> Đúng: Số âm làm vectơ đổi chiều.
- Sai: Nghĩ $0\vec a$ vẫn cùng hướng với $\vec a$ -> Đúng: $0\vec a=\vec 0$, vectơ không không có hướng xác định.

---

### 26. Ứng dụng tích vô hướng tính góc, độ dài

- ID: `0cce1ec9-dd55-5de1-a464-cdb4ff97ed40`
- Chủ đề: Vectơ và tọa độ Oxyz
- Mức độ: `thong_hieu`
- Số bài tập: 10

## I. Công thức & định nghĩa cốt lõi

Trong mặt phẳng tọa độ, với hai vectơ $\vec{u}=(x_1;y_1)$ và $\vec{v}=(x_2;y_2)$, tích vô hướng được tính bởi:

$$\vec{u}\cdot\vec{v}=x_1x_2+y_1y_2.$$

Nếu biết độ dài và góc giữa hai vectơ, ta có công thức hình học:

$$\vec{u}\cdot\vec{v}=|\vec{u}|\,|\vec{v}|\cos\alpha,$$

trong đó $\alpha$ là góc giữa $\vec{u}$ và $\vec{v}$, với $0^\circ\le \alpha\le 180^\circ$.

Độ dài vectơ $\vec{u}=(x;y)$ là:

$$|\vec{u}|=\sqrt{x^2+y^2}.$$

Từ đó, nếu $\vec{u}$ và $\vec{v}$ đều khác vectơ-không, ta tính được góc giữa chúng bằng:

$$\cos\alpha=\frac{\vec{u}\cdot\vec{v}}{|\vec{u}|\,|\vec{v}|}.$$

Một ứng dụng quan trọng là nhận biết vuông góc: hai vectơ khác vectơ-không vuông góc khi và chỉ khi

$$\vec{u}\cdot\vec{v}=0.$$

Ngoài ra, trong bài toán tọa độ điểm, nếu $A(x_A;y_A)$, $B(x_B;y_B)$ thì

$$\vec{AB}=(x_B-x_A;y_B-y_A),$$

và độ dài đoạn thẳng $AB$ là:

$$AB=|\vec{AB}|=\sqrt{(x_B-x_A)^2+(y_B-y_A)^2}.$$

## II. Phương pháp làm nhanh

Bước 1: Chuyển dữ kiện về vectơ tọa độ. Nếu đề cho điểm, hãy lập các vectơ cần dùng, ví dụ $\vec{AB}$, $\vec{AC}$, $\vec{BC}$.

Bước 2: Xác định mục tiêu bài toán. Nếu cần tính độ dài, dùng công thức $|\vec{u}|=\sqrt{x^2+y^2}$. Nếu cần tính góc, dùng công thức cosin. Nếu cần chứng minh vuông góc, chỉ cần kiểm tra tích vô hướng bằng $0$.

Bước 3: Tính tích vô hướng bằng biểu thức tọa độ. Đây là bước dễ sai dấu, nên nên viết rõ:

$$\vec{u}\cdot\vec{v}=x_1x_2+y_1y_2.$$

Bước 4: Kết luận theo yêu cầu. Với bài tính góc, sau khi tìm $\cos\alpha$, cần suy ra $\alpha$. Nếu $\cos\alpha=0$ thì $\alpha=90^\circ$; nếu $\cos\alpha=\frac12$ thì $\alpha=60^\circ$; nếu $\cos\alpha=-\frac12$ thì $\alpha=120^\circ$.

Một mẹo quan trọng: khi tính góc tại đỉnh $A$ của tam giác $ABC$, phải dùng hai vectơ cùng gốc $A$, tức là $\vec{AB}$ và $\vec{AC}$. Không nên dùng nhầm $\vec{BA}$ và $\vec{AC}$ nếu chưa kiểm tra hướng, vì có thể làm đổi dấu cosin.

## III. Ví dụ minh họa

Cho $A(1;2)$, $B(4;6)$, $C(5;1)$. Tính độ dài $AB$ và góc $\widehat{BAC}$.

Ta có:

$$\vec{AB}=(4-1;6-2)=(3;4),$$

nên

$$AB=|\vec{AB}|=\sqrt{3^2+4^2}=5.$$

Tiếp theo,

$$\vec{AC}=(5-1;1-2)=(4;-1).$$

Góc $\widehat{BAC}$ là góc giữa $\vec{AB}$ và $\vec{AC}$. Ta tính:

$$\vec{AB}\cdot\vec{AC}=3\cdot4+4\cdot(-1)=12-4=8.$$

Độ dài:

$$|\vec{AB}|=5,$$

$$|\vec{AC}|=\sqrt{4^2+(-1)^2}=\sqrt{17}.$$

Suy ra:

$$\cos\widehat{BAC}=\frac{\vec{AB}\cdot\vec{AC}}{|\vec{AB}|\,|\vec{AC}|}=\frac{8}{5\sqrt{17}}.$$

Vậy $AB=5$ và

$$\widehat{BAC}=\arccos\frac{8}{5\sqrt{17}}.$$

Nếu đề yêu cầu tính gần đúng, ta dùng máy tính để suy ra góc xấp xỉ.

Xét thêm câu hỏi: $AB$ có vuông góc với $AC$ không? Vì $\vec{AB}\cdot\vec{AC}=8\ne0$, nên $AB$ không vuông góc với $AC$.

## IV. Chú ý tránh sai

Thứ nhất, tích vô hướng là một số, không phải là vectơ. Vì vậy kết quả của $\vec{u}\cdot\vec{v}$ không viết dưới dạng tọa độ.

Thứ hai, khi tính góc giữa hai đường thẳng hoặc hai đoạn thẳng, cần chọn đúng hai vectơ chỉ phương. Nếu đổi chiều một vectơ, cosin có thể đổi dấu, dẫn đến góc bù nhau. Với góc trong tam giác tại một đỉnh, hãy ưu tiên dùng hai vectơ cùng gốc tại đỉnh đó.

Thứ ba, công thức tính góc chỉ dùng được khi hai vectơ đều khác vectơ-không. Nếu một vectơ có độ dài bằng $0$, góc không xác định.

Thứ tư, cần phân biệt $\vec{AB}$ và $\vec{BA}$. Ta có $\vec{BA}=-\vec{AB}$, nên tích vô hướng với một vectơ khác cũng đổi dấu.

Cuối cùng, khi rút gọn biểu thức chứa căn, không nên làm tròn quá sớm. Hãy giữ dạng chính xác như $\frac{8}{5\sqrt{17}}$ hoặc hợp lý hóa nếu cần.

#### Quy tắc chính

- Với $\vec{u}=(x_1;y_1)$, $\vec{v}=(x_2;y_2)$ thì $\vec{u}\cdot\vec{v}=x_1x_2+y_1y_2$.
- Độ dài $\vec{u}=(x;y)$ là $|\vec{u}|=\sqrt{x^2+y^2}$.
- Góc giữa hai vectơ khác $\vec{0}$ thỏa $\cos\alpha=\frac{\vec{u}\cdot\vec{v}}{|\vec{u}|\,|\vec{v}|}$.
- Hai vectơ khác $\vec{0}$ vuông góc khi và chỉ khi tích vô hướng bằng $0$.
- Góc tại đỉnh nào thì nên lập hai vectơ cùng gốc tại đỉnh đó.

#### Lỗi thường gặp

- Sai: Tính $\vec{AB}=(x_A-x_B;y_A-y_B)$ -> Đúng: $\vec{AB}=(x_B-x_A;y_B-y_A)$.
- Sai: Quên nhân cả hai tọa độ khi tính tích vô hướng -> Đúng: Dùng đủ $x_1x_2+y_1y_2$.
- Sai: Kết luận vuông góc khi tích vô hướng khác $0$ -> Đúng: Chỉ vuông góc khi $\vec{u}\cdot\vec{v}=0$.
- Sai: Dùng nhầm vectơ ngược hướng làm đổi dấu cosin -> Đúng: Với góc tại $A$, dùng $\vec{AB}$ và $\vec{AC}$.

---

### 27. Tích có hướng và ứng dụng hình học

- ID: `7366aea2-fe3f-5f91-b1a7-7807202152de`
- Chủ đề: Vectơ và tọa độ Oxyz
- Mức độ: `thong_hieu`
- Số bài tập: 10

## I. Công thức & định nghĩa cốt lõi

Trong không gian $Oxyz$, với hai vectơ $\vec a=(a_1,a_2,a_3)$ và $\vec b=(b_1,b_2,b_3)$, **tích có hướng** của $\vec a$ và $\vec b$ là vectơ kí hiệu $[\vec a,\vec b]$ hoặc $\vec a\times \vec b$, được tính bởi:

$$\vec a\times \vec b=(a_2b_3-a_3b_2,\ a_3b_1-a_1b_3,\ a_1b_2-a_2b_1).$$

Có thể nhớ bằng định thức hình thức:

$$\vec a\times \vec b=\begin{vmatrix}\vec i&\vec j&\vec k\\a_1&a_2&a_3\\b_1&b_2&b_3\end{vmatrix}.$$

Vectơ $\vec a\times \vec b$ vuông góc với cả $\vec a$ và $\vec b$. Độ dài của nó là:

$$|\vec a\times \vec b|=|\vec a|\,|\vec b|\sin\varphi,$$

trong đó $\varphi$ là góc giữa hai vectơ $\vec a,\vec b$. Vì vậy, $|\vec a\times \vec b|$ chính là diện tích hình bình hành tạo bởi hai vectơ $\vec a,\vec b$.

Các ứng dụng quan trọng:

- Diện tích hình bình hành: $S=|\vec a\times \vec b|$.
- Diện tích tam giác: $S=\dfrac12|\vec a\times \vec b|$.
- Thể tích khối hộp tạo bởi ba vectơ $\vec a,\vec b,\vec c$:

$$V=|[\vec a,\vec b]\cdot \vec c|.$$

- Thể tích tứ diện $ABCD$:

$$V_{ABCD}=\dfrac16|[\overrightarrow{AB},\overrightarrow{AC}]\cdot\overrightarrow{AD}|.$$

## II. Phương pháp làm nhanh

Bước 1: Chọn các vectơ phù hợp. Nếu bài cho điểm $A,B,C,D$, hãy lập các vectơ chung gốc, thường là $\overrightarrow{AB},\overrightarrow{AC},\overrightarrow{AD}$.

Bước 2: Tính tích có hướng của hai vectơ. Khi tính, nên viết rõ theo công thức tọa độ để tránh nhầm dấu:

$$\vec a\times\vec b=(a_2b_3-a_3b_2,\ a_3b_1-a_1b_3,\ a_1b_2-a_2b_1).$$

Bước 3: Xác định đại lượng cần tìm. Nếu là diện tích, lấy độ dài tích có hướng. Nếu là thể tích, lấy tích vô hướng của tích có hướng với vectơ thứ ba rồi lấy trị tuyệt đối.

Bước 4: Nhớ hệ số. Tam giác lấy $\dfrac12$, tứ diện lấy $\dfrac16$, còn hình bình hành và khối hộp không chia thêm.

Một mẹo thi nhanh: nếu cần kiểm tra hai vectơ cùng phương, ta dùng $\vec a\times\vec b=\vec 0$. Nếu cần tìm vectơ pháp tuyến của mặt phẳng đi qua ba điểm $A,B,C$, ta có thể lấy:

$$\vec n=\overrightarrow{AB}\times\overrightarrow{AC}.$$

## III. Ví dụ minh họa

Cho $A(1,0,2)$, $B(3,1,0)$, $C(0,2,1)$. Tính diện tích tam giác $ABC$.

Ta có:

$$\overrightarrow{AB}=(2,1,-2),\quad \overrightarrow{AC}=(-1,2,-1).$$

Tính tích có hướng:

$$\overrightarrow{AB}\times\overrightarrow{AC}=(1\cdot(-1)-(-2)\cdot2,\ (-2)\cdot(-1)-2\cdot(-1),\ 2\cdot2-1\cdot(-1)).$$

Suy ra:

$$\overrightarrow{AB}\times\overrightarrow{AC}=(3,4,5).$$

Độ dài là:

$$|\overrightarrow{AB}\times\overrightarrow{AC}|=\sqrt{3^2+4^2+5^2}=\sqrt{50}=5\sqrt2.$$

Vậy diện tích tam giác $ABC$ là:

$$S_{ABC}=\dfrac12\cdot5\sqrt2=\dfrac{5\sqrt2}{2}.$$

Nếu thêm điểm $D(2,1,3)$, ta có $\overrightarrow{AD}=(1,1,1)$. Thể tích tứ diện $ABCD$ là:

$$V=\dfrac16|[(3,4,5)\cdot(1,1,1)]|=\dfrac16|12|=2.$$

## IV. Chú ý tránh sai

Tích có hướng là một vectơ, không phải một số. Vì vậy sau khi tính $\vec a\times\vec b$, nếu cần diện tích phải lấy độ dài của vectơ đó.

Thứ tự tích có hướng ảnh hưởng đến dấu: $\vec a\times\vec b=-(\vec b\times\vec a)$. Tuy nhiên khi tính diện tích hoặc thể tích, thường lấy trị tuyệt đối nên kết quả hình học không âm.

Không được quên hệ số $\dfrac12$ khi tính diện tích tam giác và $\dfrac16$ khi tính thể tích tứ diện. Đây là lỗi rất hay gặp trong bài thi trắc nghiệm.

Khi dùng công thức định thức, thành phần theo $\vec j$ rất dễ sai dấu. Nếu chưa chắc, hãy dùng trực tiếp công thức tọa độ ba thành phần để an toàn hơn.

#### Quy tắc chính

- $\vec a\times\vec b$ vuông góc với cả $\vec a$ và $\vec b$.
- $|\vec a\times\vec b|$ là diện tích hình bình hành tạo bởi hai vectơ.
- Diện tích tam giác bằng $\dfrac12|\vec a\times\vec b|$.
- Thể tích tứ diện bằng $\dfrac16|[\vec a,\vec b]\cdot\vec c|$.
- Đổi thứ tự tích có hướng thì đổi dấu.

#### Lỗi thường gặp

- Sai: Coi $\vec a\times\vec b$ là một số -> Đúng: Đây là một vectơ, muốn tính diện tích phải lấy độ dài.
- Sai: Quên trị tuyệt đối khi tính thể tích -> Đúng: Thể tích luôn không âm nên dùng $|[\vec a,\vec b]\cdot\vec c|$.
- Sai: Tính diện tích tam giác bằng $|\vec a\times\vec b|$ -> Đúng: Phải chia $2$.
- Sai: Nhầm dấu khi khai triển định thức -> Đúng: Dùng công thức tọa độ hoặc kiểm tra lại từng thành phần.

---

### 28. Tâm tỉ cự trong không gian Oxyz

- ID: `48791451-b084-5ec9-b52d-eb90648bc9b3`
- Chủ đề: Vectơ và tọa độ Oxyz
- Mức độ: `van_dung`
- Số bài tập: 10

## I. Công thức & định nghĩa cốt lõi

Trong hình học vectơ, **tâm tỉ cự** là công cụ đại số giúp biểu diễn nhanh các điểm đặc biệt như trung điểm, trọng tâm, điểm chia đoạn, tâm khối lượng. Cho các điểm $A_1,A_2,\ldots,A_n$ gắn với các hệ số thực $m_1,m_2,\ldots,m_n$ sao cho $m_1+m_2+\cdots+m_n\ne 0$. Điểm $G$ thỏa mãn

$$m_1\overrightarrow{GA_1}+m_2\overrightarrow{GA_2}+\cdots+m_n\overrightarrow{GA_n}=\overrightarrow{0}$$

được gọi là **tâm tỉ cự** của hệ điểm $\{(A_i,m_i)\}$.

Nếu chọn gốc tọa độ $O$, ta có công thức vectơ vị trí:

$$\overrightarrow{OG}=\frac{m_1\overrightarrow{OA_1}+m_2\overrightarrow{OA_2}+\cdots+m_n\overrightarrow{OA_n}}{m_1+m_2+\cdots+m_n}.$$

Trong không gian $Oxyz$, nếu $A_i(x_i;y_i;z_i)$ thì

$$G\left(\frac{\sum m_ix_i}{\sum m_i};\frac{\sum m_iy_i}{\sum m_i};\frac{\sum m_iz_i}{\sum m_i}\right).$$

Các trường hợp quen thuộc: trung điểm $M$ của $AB$ ứng với $m_A=m_B=1$; trọng tâm tam giác $ABC$ ứng với ba hệ số bằng nhau; điểm $M$ chia đoạn $AB$ theo tỉ số $AM:MB=p:q$ thì

$$\overrightarrow{OM}=\frac{q\overrightarrow{OA}+p\overrightarrow{OB}}{p+q}.$$

Lưu ý hệ số đứng trước điểm đối diện với đoạn tương ứng: gần $A$ hơn thì hệ số của $A$ thường lớn hơn trong công thức tọa độ.

## II. Phương pháp làm nhanh

Bước 1: Nhận dạng điểm cần tìm là điểm đặc biệt nào: trung điểm, trọng tâm, điểm chia đoạn, điểm thỏa mãn một đẳng thức vectơ, hay tâm của hệ nhiều điểm.

Bước 2: Đưa điều kiện về dạng chuẩn

$$\sum m_i\overrightarrow{GA_i}=\overrightarrow{0}.$$

Nếu đề cho biểu thức như $2\overrightarrow{MA}-3\overrightarrow{MB}+\overrightarrow{MC}=\overrightarrow{0}$ thì $M$ là tâm tỉ cự của $A,B,C$ với hệ số $2,-3,1$, miễn tổng hệ số khác $0$.

Bước 3: Dùng công thức tọa độ để tìm điểm. Với bài thi trắc nghiệm, nên tính từng tọa độ theo bảng hệ số để tránh nhầm dấu.

Bước 4: Nếu tổng hệ số bằng $0$, không có tâm tỉ cự hữu hạn theo công thức trên. Khi đó biểu thức thường rút gọn thành quan hệ song song, thẳng hàng hoặc điều kiện vô nghiệm/hằng đúng.

Một mẹo quan trọng: Khi cần chứng minh ba điểm thẳng hàng, hãy cố gắng biểu diễn một điểm dưới dạng tổ hợp affine của hai điểm còn lại:

$$\overrightarrow{OM}=\alpha\overrightarrow{OA}+\beta\overrightarrow{OB},\quad \alpha+\beta=1.$$

Khi đó $M\in AB$ nếu $\alpha,\beta$ là các số thực. Nếu thêm $\alpha,\beta>0$ thì $M$ nằm trong đoạn $AB$.

## III. Ví dụ minh họa

Cho $A(1;2;-1)$, $B(3;0;5)$, $C(-2;4;1)$. Tìm điểm $G$ thỏa mãn

$$2\overrightarrow{GA}+3\overrightarrow{GB}+\overrightarrow{GC}=\overrightarrow{0}.$$

Ta nhận thấy $G$ là tâm tỉ cự của hệ $(A,2),(B,3),(C,1)$. Tổng hệ số là $2+3+1=6\ne0$, nên

$$\overrightarrow{OG}=\frac{2\overrightarrow{OA}+3\overrightarrow{OB}+\overrightarrow{OC}}{6}.$$

Tính tọa độ:

$$x_G=\frac{2\cdot1+3\cdot3+1\cdot(-2)}{6}=\frac{9}{6}=\frac32,$$

$$y_G=\frac{2\cdot2+3\cdot0+1\cdot4}{6}=\frac{8}{6}=\frac43,$$

$$z_G=\frac{2\cdot(-1)+3\cdot5+1\cdot1}{6}=\frac{14}{6}=\frac73.$$

Vậy

$$G\left(\frac32;\frac43;\frac73\right).$$

Ví dụ thêm: Nếu $M$ thỏa mãn $\overrightarrow{OM}=\frac{2\overrightarrow{OA}+3\overrightarrow{OB}}{5}$ thì $M\in AB$ vì $\frac25+\frac35=1$. Hơn nữa $M$ nằm trong đoạn $AB$ và chia đoạn theo $AM:MB=3:2$.

## IV. Chú ý tránh sai

Thứ nhất, không được quên điều kiện tổng hệ số khác $0$. Công thức tâm tỉ cự chỉ dùng trực tiếp khi $\sum m_i\ne0$.

Thứ hai, phải phân biệt hệ số trong công thức với tỉ số chia đoạn. Nếu $AM:MB=p:q$ thì công thức là $\overrightarrow{OM}=\frac{q\overrightarrow{OA}+p\overrightarrow{OB}}{p+q}$, không phải đổi ngược tùy tiện.

Thứ ba, hệ số âm vẫn được phép. Khi có hệ số âm, điểm tâm tỉ cự có thể nằm ngoài đoạn hoặc ngoài tam giác; không nên kết luận bằng hình vẽ cảm tính.

Thứ tư, trong bài $Oxyz$, hãy tính riêng từng tọa độ $x,y,z$ và giữ đúng dấu. Sai dấu ở một tọa độ sẽ làm hỏng toàn bộ đáp án.

Tóm lại, tâm tỉ cự biến các bài hình học điểm đặc biệt thành bài toán đại số vectơ. Chỉ cần nhận đúng hệ số, kiểm tra tổng hệ số, rồi áp dụng công thức tọa độ là có thể giải nhanh nhiều câu vận dụng trong đề thi THPT.

#### Quy tắc chính

- Tâm tỉ cự $G$ thỏa mãn $\sum m_i\overrightarrow{GA_i}=\overrightarrow{0}$ với $\sum m_i\ne0$.
- Công thức tọa độ: mỗi tọa độ của $G$ bằng trung bình có trọng số theo các hệ số $m_i$.
- Điểm thuộc đường thẳng $AB$ khi biểu diễn được $\overrightarrow{OM}=\alpha\overrightarrow{OA}+\beta\overrightarrow{OB}$ và $\alpha+\beta=1$.
- Điểm chia $AB$ theo $AM:MB=p:q$ có công thức dùng hệ số $q$ cho $A$ và $p$ cho $B$.
- Hệ số âm vẫn hợp lệ nhưng vị trí điểm có thể nằm ngoài đoạn hoặc ngoài miền hình học quen thuộc.

#### Lỗi thường gặp

- Sai: Dùng công thức tâm tỉ cự khi tổng hệ số bằng $0$ -> Đúng: Kiểm tra $\sum m_i\ne0$ trước khi áp dụng.
- Sai: Với $AM:MB=p:q$ viết $M=\frac{pA+qB}{p+q}$ -> Đúng: Viết $M=\frac{qA+pB}{p+q}$.
- Sai: Bỏ qua dấu âm của hệ số trong biểu thức vectơ -> Đúng: Giữ nguyên dấu khi tính từng tọa độ.
- Sai: Kết luận điểm nằm trong đoạn chỉ vì thuộc đường thẳng -> Đúng: Cần thêm các hệ số tổ hợp affine không âm.

---

### 29. Mô hình hóa lực và vận tốc bằng vectơ Oxyz

- ID: `f462b685-21c7-5d79-b9a7-cc5f892649a5`
- Chủ đề: Vectơ và tọa độ Oxyz
- Mức độ: `thong_hieu`
- Số bài tập: 10

## I. Công thức & định nghĩa cốt lõi

Trong không gian $Oxyz$, một đại lượng có hướng như lực, vận tốc, độ dời thường được biểu diễn bằng **vectơ**. Nếu vật đi từ điểm $A(x_A,y_A,z_A)$ đến điểm $B(x_B,y_B,z_B)$ thì vectơ độ dời là

$$\overrightarrow{AB}=(x_B-x_A,\ y_B-y_A,\ z_B-z_A).$$

Độ dài vectơ $\vec u=(a,b,c)$ là

$$|\vec u|=\sqrt{a^2+b^2+c^2}.$$

Nếu một lực có độ lớn $F$ và hướng theo vectơ $\vec u$, thì vectơ lực là

$$\vec F=F\cdot \frac{\vec u}{|\vec u|}.$$

Ở đây $\frac{\vec u}{|\vec u|}$ là vectơ đơn vị cùng hướng với $\vec u$. Tương tự, nếu vận tốc có tốc độ $v$ và hướng theo $\vec u$, ta có

$$\vec v=v\cdot \frac{\vec u}{|\vec u|}.$$

Vị trí của vật theo thời gian thường được mô hình hóa bởi

$$M(t)=M_0+t\vec v,$$

trong đó $M_0(x_0,y_0,z_0)$ là vị trí ban đầu, $\vec v=(a,b,c)$ là vectơ vận tốc, $t$ là thời gian. Khi đó

$$M(t)=(x_0+at,\ y_0+bt,\ z_0+ct).$$

Nếu vật chịu nhiều lực $\vec F_1,\vec F_2,\ldots$, hợp lực là

$$\vec F=\vec F_1+\vec F_2+\cdots.$$

Hợp lực bằng $\vec 0$ thì vật cân bằng về mặt lực.

## II. Phương pháp làm nhanh

Bước 1: **Chọn hệ trục tọa độ**. Đọc đề và xác định các điểm, hướng chuyển động, hướng lực. Trong bài toán thực tế, trục $Oz$ thường biểu diễn chiều cao, còn $Ox,Oy$ biểu diễn mặt phẳng ngang.

Bước 2: **Đổi dữ kiện thành tọa độ hoặc vectơ**. Nếu đề cho hai điểm đầu - cuối, hãy lập $\overrightarrow{AB}$. Nếu đề cho hướng chuyển động, hãy tìm một vectơ chỉ phương.

Bước 3: **Chuẩn hóa hướng nếu có độ lớn**. Khi biết lực có độ lớn $F$ hoặc tốc độ $v$, không lấy ngay vectơ hướng làm lực hoặc vận tốc. Phải dùng

$$\vec F=F\frac{\vec u}{|\vec u|},\quad \vec v=v\frac{\vec u}{|\vec u|}.$$

Bước 4: **Viết phương trình vị trí hoặc tính hợp lực**. Nếu hỏi vị trí sau $t$ giây, dùng $M(t)=M_0+t\vec v$. Nếu hỏi cân bằng hoặc tổng tác dụng, cộng các vectơ lực theo từng tọa độ.

Bước 5: **Kiểm tra đơn vị và ý nghĩa thực tế**. Tọa độ có thể tính bằng mét, vận tốc bằng m/s, lực bằng Newton. Nếu thời gian âm hoặc độ dài âm xuất hiện thì cần xem lại mô hình.

## III. Ví dụ minh họa

Một drone đang ở điểm $A(2,1,5)$, cần bay theo hướng đến điểm $B(5,5,7)$ với tốc độ $6$ m/s. Hỏi vectơ vận tốc của drone và vị trí sau $3$ giây là gì?

Ta có vectơ hướng bay:

$$\overrightarrow{AB}=(5-2,5-1,7-5)=(3,4,2).$$

Độ dài vectơ hướng:

$$|\overrightarrow{AB}|=\sqrt{3^2+4^2+2^2}=\sqrt{29}.$$

Vì tốc độ bằng $6$ m/s nên vectơ vận tốc là

$$\vec v=6\cdot \frac{(3,4,2)}{\sqrt{29}}=\left(\frac{18}{\sqrt{29}},\frac{24}{\sqrt{29}},\frac{12}{\sqrt{29}}\right).$$

Vị trí sau $3$ giây:

$$M(3)=A+3\vec v.$$

Suy ra

$$M(3)=\left(2+\frac{54}{\sqrt{29}},\ 1+\frac{72}{\sqrt{29}},\ 5+\frac{36}{\sqrt{29}}\right).$$

Ý nghĩa: drone không nhất thiết đến đúng $B$ sau $3$ giây; điểm $B$ chỉ dùng để xác định hướng bay. Muốn biết có đến $B$ hay không, cần so sánh quãng đường $AB=\sqrt{29}$ với quãng đường bay $6\cdot 3=18$.

Ví dụ về lực: Một vật chịu hai lực $\vec F_1=(3,-2,4)$ và $\vec F_2=(-1,5,2)$ Newton. Hợp lực là

$$\vec F=\vec F_1+\vec F_2=(2,3,6).$$

Độ lớn hợp lực:

$$|\vec F|=\sqrt{2^2+3^2+6^2}=7.$$

Vậy hợp lực tác dụng lên vật có độ lớn $7$ N.

## IV. Chú ý tránh sai

Không nhầm giữa **vectơ hướng** và **vectơ có độ lớn thực tế**. Vectơ $(3,4,2)$ chỉ cho hướng; nếu tốc độ là $6$ thì vận tốc phải có độ dài bằng $6$.

Khi tính vị trí theo thời gian, phải nhân vận tốc với thời gian: $M(t)=M_0+t\vec v$. Không được cộng trực tiếp $M_0+\vec v$ nếu đề hỏi sau nhiều giây.

Khi cộng lực, cộng theo từng tọa độ: hoành độ với hoành độ, tung độ với tung độ, cao độ với cao độ. Không cộng độ lớn riêng lẻ để ra độ lớn hợp lực.

Trong bài toán thực tế, luôn đọc kỹ đơn vị. Nếu tốc độ là km/h mà thời gian tính bằng giây, cần đổi đơn vị trước khi thay vào công thức.

#### Quy tắc chính

- Từ hai điểm $A,B$, luôn lập $\overrightarrow{AB}=B-A$ để xác định hướng.
- Có độ lớn lực hoặc tốc độ thì phải chuẩn hóa vectơ hướng trước.
- Vị trí chuyển động thẳng đều dùng công thức $M(t)=M_0+t\vec v$.
- Hợp lực bằng tổng các vectơ lực theo từng tọa độ.
- Luôn kiểm tra đơn vị trước khi tính kết quả thực tế.

#### Lỗi thường gặp

- Sai: Lấy vectơ hướng làm vectơ vận tốc luôn -> Đúng: Nhân vectơ đơn vị cùng hướng với tốc độ.
- Sai: Tính hợp lực bằng cách cộng độ lớn các lực -> Đúng: Cộng vectơ trước rồi mới tính độ lớn.
- Sai: Viết $\overrightarrow{AB}=(x_A-x_B,y_A-y_B,z_A-z_B)$ -> Đúng: $\overrightarrow{AB}=(x_B-x_A,y_B-y_A,z_B-z_A)$.
- Sai: Quên đổi km/h sang m/s hoặc phút sang giây -> Đúng: Đổi đơn vị thống nhất trước khi thay số.

---

## Chương 6: Phương trình và hình học Oxyz

- Môn: `toan_hinh`
- Số bài: 8

### 30. Phương trình tổng quát và đoạn chắn của mặt phẳng

- ID: `1ad7e957-1a6b-544e-8bb0-e1b033d0317d`
- Chủ đề: Phương trình và hình học Oxyz
- Mức độ: `nhan_biet`
- Số bài tập: 10

## I. Công thức & định nghĩa cốt lõi

Trong không gian $Oxyz$, mặt phẳng thường được nhận biết qua **vectơ pháp tuyến** và **phương trình tổng quát**.

Một vectơ khác vectơ không $\vec n=(A;B;C)$ được gọi là **vectơ pháp tuyến** của mặt phẳng $(P)$ nếu $\vec n$ vuông góc với mọi vectơ nằm trong mặt phẳng đó. Khi đó, phương trình tổng quát của $(P)$ có dạng:

$$Ax+By+Cz+D=0$$

trong đó $A,B,C$ không đồng thời bằng $0$. Vectơ $\vec n=(A;B;C)$ chính là một vectơ pháp tuyến của mặt phẳng.

Nếu mặt phẳng $(P)$ đi qua điểm $M_0(x_0;y_0;z_0)$ và có vectơ pháp tuyến $\vec n=(A;B;C)$ thì phương trình mặt phẳng là:

$$A(x-x_0)+B(y-y_0)+C(z-z_0)=0$$

Khai triển ra ta được phương trình tổng quát.

Ngoài ra, nếu mặt phẳng cắt ba trục tọa độ lần lượt tại $A(a;0;0)$, $B(0;b;0)$, $C(0;0;c)$ với $abc\ne 0$, thì phương trình đoạn chắn là:

$$\frac{x}{a}+\frac{y}{b}+\frac{z}{c}=1$$

Ở đây $a,b,c$ gọi là các đoạn chắn trên các trục $Ox, Oy, Oz$. Cần chú ý rằng $a,b,c$ có thể âm, không nhất thiết dương.

## II. Phương pháp làm nhanh

Dạng nhận biết thường yêu cầu xác định vectơ pháp tuyến, viết hoặc nhận ra phương trình mặt phẳng.

Nếu đề cho phương trình $Ax+By+Cz+D=0$, ta đọc ngay vectơ pháp tuyến là:

$$\vec n=(A;B;C)$$

Ví dụ, mặt phẳng $2x-y+3z-5=0$ có một vectơ pháp tuyến là $\vec n=(2;-1;3)$.

Nếu đề cho một điểm $M_0(x_0;y_0;z_0)$ và vectơ pháp tuyến $\vec n=(A;B;C)$, ta thay vào công thức:

$$A(x-x_0)+B(y-y_0)+C(z-z_0)=0$$

Sau đó rút gọn để được phương trình tổng quát.

Nếu đề cho phương trình đoạn chắn $\frac{x}{a}+\frac{y}{b}+\frac{z}{c}=1$, ta có thể nhận ra ngay mặt phẳng cắt các trục tại $(a;0;0)$, $(0;b;0)$, $(0;0;c)$. Muốn đưa về phương trình tổng quát, chỉ cần quy đồng mẫu.

Ngược lại, nếu đề yêu cầu viết phương trình mặt phẳng theo đoạn chắn và đã biết ba giao điểm với các trục, ta dùng trực tiếp:

$$\frac{x}{a}+\frac{y}{b}+\frac{z}{c}=1$$

Điều kiện quan trọng là cả ba đoạn chắn đều khác $0$.

## III. Ví dụ minh họa

**Ví dụ 1.** Cho mặt phẳng $(P): 3x-2y+z+4=0$. Hãy chỉ ra một vectơ pháp tuyến của $(P)$.

Ta so sánh với dạng $Ax+By+Cz+D=0$. Khi đó $A=3$, $B=-2$, $C=1$. Vậy một vectơ pháp tuyến của $(P)$ là:

$$\vec n=(3;-2;1)$$

Các vectơ cùng phương với $\vec n$, chẳng hạn $(6;-4;2)$ hoặc $(-3;2;-1)$, cũng là vectơ pháp tuyến của $(P)$.

**Ví dụ 2.** Viết phương trình mặt phẳng đi qua $M(1;-2;3)$ và có vectơ pháp tuyến $\vec n=(2;1;-1)$.

Dùng công thức:

$$2(x-1)+1(y+2)-1(z-3)=0$$

Khai triển:

$$2x-2+y+2-z+3=0$$

Suy ra:

$$2x+y-z+3=0$$

Vậy phương trình mặt phẳng cần tìm là $2x+y-z+3=0$.

**Ví dụ 3.** Viết phương trình mặt phẳng cắt các trục tọa độ tại $A(2;0;0)$, $B(0;-3;0)$, $C(0;0;6)$.

Vì các đoạn chắn lần lượt là $a=2$, $b=-3$, $c=6$, ta có:

$$\frac{x}{2}+\frac{y}{-3}+\frac{z}{6}=1$$

hay:

$$\frac{x}{2}-\frac{y}{3}+\frac{z}{6}=1$$

Quy đồng mẫu $6$:

$$3x-2y+z=6$$

Dạng tổng quát là:

$$3x-2y+z-6=0$$

## IV. Chú ý tránh sai

Thứ nhất, trong phương trình $Ax+By+Cz+D=0$, vectơ pháp tuyến là $(A;B;C)$, không lấy thêm hệ số $D$.

Thứ hai, phương trình tổng quát của mặt phẳng không phải là duy nhất. Hai phương trình nhân với nhau bởi một số khác $0$ vẫn biểu diễn cùng một mặt phẳng. Ví dụ $x+y+z-1=0$ và $2x+2y+2z-2=0$ là cùng một mặt phẳng.

Thứ ba, khi dùng phương trình đoạn chắn, phải đảm bảo mặt phẳng cắt cả ba trục tại các điểm khác gốc tọa độ, tức là $a,b,c\ne 0$. Nếu một đoạn chắn bằng $0$ thì không dùng được dạng $\frac{x}{a}+\frac{y}{b}+\frac{z}{c}=1$.

Thứ tư, dấu của đoạn chắn rất quan trọng. Nếu mặt phẳng cắt trục $Oy$ tại $(0;-3;0)$ thì mẫu tương ứng là $-3$, không được tự ý đổi thành $3$.

#### Quy tắc chính

- Từ $Ax+By+Cz+D=0$ suy ra vectơ pháp tuyến là $(A;B;C)$.
- Mặt phẳng qua $M_0(x_0;y_0;z_0)$, pháp tuyến $(A;B;C)$ có phương trình $A(x-x_0)+B(y-y_0)+C(z-z_0)=0$.
- Phương trình đoạn chắn là $\frac{x}{a}+\frac{y}{b}+\frac{z}{c}=1$ với $abc\ne 0$.
- Có thể nhân toàn bộ phương trình mặt phẳng với một số khác $0$ mà không đổi mặt phẳng.

#### Lỗi thường gặp

- Sai: Lấy vectơ pháp tuyến là $(A;B;C;D)$ -> Đúng: Chỉ lấy $(A;B;C)$.
- Sai: Quên đổi dấu khi thay điểm vào $A(x-x_0)+B(y-y_0)+C(z-z_0)=0$ -> Đúng: Thay đúng từng tọa độ với dấu trừ.
- Sai: Dùng phương trình đoạn chắn khi một mẫu bằng $0$ -> Đúng: Chỉ dùng khi $a,b,c$ đều khác $0$.
- Sai: Tự đổi đoạn chắn âm thành dương -> Đúng: Giữ đúng dấu của giao điểm trên trục.

---

### 31. Phương trình tham số và chính tắc của đường thẳng

- ID: `aec67a65-2c97-5614-b499-d07fab0d9037`
- Chủ đề: Phương trình và hình học Oxyz
- Mức độ: `nhan_biet`
- Số bài tập: 10

## I. Công thức & định nghĩa cốt lõi

Trong mặt phẳng tọa độ $Oxy$, một đường thẳng $d$ được xác định nếu biết một điểm $M_0(x_0;y_0)$ thuộc đường thẳng và một vectơ chỉ phương $\vec{u}=(a;b)$, với $\vec{u}\ne \vec{0}$.

Vectơ $\vec{u}=(a;b)$ được gọi là **vectơ chỉ phương** của đường thẳng $d$ nếu giá của $\vec{u}$ song song hoặc trùng với $d$. Nói đơn giản, $\vec{u}$ cho biết “hướng đi” của đường thẳng.

Nếu $d$ đi qua $M_0(x_0;y_0)$ và có vectơ chỉ phương $\vec{u}=(a;b)$ thì phương trình tham số của $d$ là:

$$\begin{cases}x=x_0+at\\y=y_0+bt\end{cases}\quad (t\in\mathbb{R}).$$

Trong đó $t$ là tham số thực. Mỗi giá trị của $t$ cho ta một điểm thuộc đường thẳng.

Nếu $a\ne0$ và $b\ne0$, từ phương trình tham số ta khử $t$ được phương trình chính tắc:

$$\frac{x-x_0}{a}=\frac{y-y_0}{b}.$$

Đây là dạng thường gặp khi bài toán cho một điểm và một vectơ chỉ phương có cả hai tọa độ khác $0$.

Lưu ý: nếu $a=0$ hoặc $b=0$ thì không viết được phương trình chính tắc theo dạng phân thức đầy đủ vì không được chia cho $0$. Khi đó nên dùng phương trình tham số hoặc viết dạng đặc biệt. Ví dụ $\vec{u}=(0;b)$ thì $x=x_0$, đường thẳng song song trục $Oy$. Nếu $\vec{u}=(a;0)$ thì $y=y_0$, đường thẳng song song trục $Ox$.

## II. Phương pháp làm nhanh

Dạng nhận biết thường yêu cầu xác định vectơ chỉ phương, viết phương trình tham số hoặc chính tắc. Cách làm nhanh là:

Bước 1: Tìm một điểm thuộc đường thẳng. Điểm này thường được cho trực tiếp, chẳng hạn $A(x_A;y_A)$.

Bước 2: Tìm vectơ chỉ phương. Nếu đề cho $\vec{u}=(a;b)$ thì dùng ngay. Nếu đường thẳng đi qua hai điểm $A(x_A;y_A)$ và $B(x_B;y_B)$ thì một vectơ chỉ phương là:

$$\vec{AB}=(x_B-x_A;y_B-y_A).$$

Bước 3: Viết phương trình tham số:

$$\begin{cases}x=x_A+at\\y=y_A+bt\end{cases}.$$

Bước 4: Nếu $a\ne0$ và $b\ne0$, có thể viết phương trình chính tắc:

$$\frac{x-x_A}{a}=\frac{y-y_A}{b}.$$

Khi làm trắc nghiệm, cần kiểm tra nhanh bằng cách thay tọa độ điểm đã cho vào phương trình. Nếu điểm không thỏa mãn thì phương trình chắc chắn sai. Ngoài ra, vectơ chỉ phương có thể nhân với số khác $0$ mà vẫn đúng. Chẳng hạn $(2;3)$, $(4;6)$, $(-2;-3)$ đều là các vectơ chỉ phương cùng phương.

## III. Ví dụ minh họa

Ví dụ 1. Viết phương trình tham số của đường thẳng $d$ đi qua $A(1;-2)$ và có vectơ chỉ phương $\vec{u}=(3;4)$.

Ta có $x_0=1$, $y_0=-2$, $a=3$, $b=4$. Vậy:

$$\begin{cases}x=1+3t\\y=-2+4t\end{cases}\quad (t\in\mathbb{R}).$$

Do $a\ne0$, $b\ne0$, phương trình chính tắc là:

$$\frac{x-1}{3}=\frac{y+2}{4}.$$

Ví dụ 2. Đường thẳng $d$ đi qua hai điểm $A(2;1)$ và $B(5;7)$. Viết phương trình tham số của $d$.

Ta có:

$$\vec{AB}=(5-2;7-1)=(3;6).$$

Vậy một vectơ chỉ phương của $d$ là $\vec{u}=(3;6)$, có thể rút gọn cùng phương thành $(1;2)$. Dùng $A(2;1)$ và $\vec{u}=(1;2)$, ta được:

$$\begin{cases}x=2+t\\y=1+2t\end{cases}\quad (t\in\mathbb{R}).$$

Phương trình chính tắc là:

$$\frac{x-2}{1}=\frac{y-1}{2}.$$

Ví dụ 3. Viết phương trình đường thẳng đi qua $M(3;-1)$ và có vectơ chỉ phương $\vec{u}=(0;5)$.

Vì hoành độ của vectơ chỉ phương bằng $0$, đường thẳng song song trục $Oy$. Phương trình tham số là:

$$\begin{cases}x=3\\y=-1+5t\end{cases}.$$

Phương trình dạng đơn giản là $x=3$. Không viết $\frac{x-3}{0}=\frac{y+1}{5}$ vì mẫu bằng $0$ là sai.

## IV. Chú ý tránh sai

Không nhầm vectơ chỉ phương với vectơ pháp tuyến. Nếu đường thẳng có vectơ pháp tuyến $\vec{n}=(A;B)$ thì một vectơ chỉ phương có thể là $\vec{u}=(-B;A)$ hoặc $(B;-A)$.

Không bắt buộc vectơ chỉ phương phải đúng y nguyên như đáp án. Chỉ cần cùng phương là được. Hai vectơ $(a;b)$ và $(ka;kb)$ với $k\ne0$ đều cho cùng một hướng đường thẳng.

Khi viết phương trình chính tắc, cần kiểm tra mẫu số. Nếu một thành phần của vectơ chỉ phương bằng $0$, hãy chuyển sang phương trình tham số hoặc phương trình dạng $x=x_0$, $y=y_0$.

Cuối cùng, dấu trong phương trình chính tắc rất dễ sai. Nếu điểm là $M_0(x_0;y_0)$ thì tử số phải là $x-x_0$ và $y-y_0$. Ví dụ $y_0=-2$ thì $y-y_0=y+2$, không phải $y-2$.

#### Quy tắc chính

- Đường thẳng cần một điểm và một vectơ chỉ phương khác vectơ không.
- Qua hai điểm $A,B$ thì vectơ chỉ phương có thể lấy là $\vec{AB}$.
- Phương trình tham số: $x=x_0+at$, $y=y_0+bt$ với $t\in\mathbb{R}$.
- Phương trình chính tắc chỉ viết khi cả $a$ và $b$ đều khác $0$.
- Vectơ chỉ phương có thể nhân với số khác $0$ mà không đổi đường thẳng.

#### Lỗi thường gặp

- Sai: Viết $\frac{x-x_0}{0}=\frac{y-y_0}{b}$ -> Đúng: Không chia cho $0$, dùng phương trình tham số hoặc $x=x_0$.
- Sai: Nhầm $y-y_0$ thành $y+y_0$ khi $y_0$ dương -> Đúng: Luôn viết đúng dạng $y-y_0$ rồi mới thay số.
- Sai: Lấy vectơ pháp tuyến làm vectơ chỉ phương -> Đúng: Nếu $\vec{n}=(A;B)$ thì lấy $\vec{u}=(-B;A)$ hoặc $(B;-A)$.
- Sai: Cho rằng $(2;4)$ và $(1;2)$ là hai hướng khác nhau -> Đúng: Chúng cùng phương nên đều là vectơ chỉ phương của cùng một đường thẳng.

---

### 32. Phương trình mặt cầu và tương giao

- ID: `fc7945f5-f2fe-567e-b028-54c016750a33`
- Chủ đề: Phương trình và hình học Oxyz
- Mức độ: `nhan_biet`
- Số bài tập: 10

## I. Công thức & định nghĩa cốt lõi

Trong không gian $Oxyz$, mặt cầu tâm $I(a;b;c)$, bán kính $R>0$ có phương trình chuẩn:

$$ (x-a)^2+(y-b)^2+(z-c)^2=R^2. $$

Nếu phương trình mặt cầu được cho ở dạng tổng quát:

$$ x^2+y^2+z^2+2Ax+2By+2Cz+D=0, $$

thì tâm là $I(-A;-B;-C)$ và bán kính:

$$ R=\sqrt{A^2+B^2+C^2-D}. $$

Điều kiện để phương trình trên là một mặt cầu thật sự là:

$$ A^2+B^2+C^2-D>0. $$

Nếu bằng $0$ thì mặt cầu suy biến thành một điểm; nếu nhỏ hơn $0$ thì không biểu diễn mặt cầu thực.

Khoảng cách từ điểm $M(x_0;y_0;z_0)$ đến tâm $I(a;b;c)$ là:

$$ IM=\sqrt{(x_0-a)^2+(y_0-b)^2+(z_0-c)^2}. $$

Vị trí của điểm $M$ đối với mặt cầu $(S)$ tâm $I$, bán kính $R$:

- $IM<R$: $M$ nằm trong mặt cầu.
- $IM=R$: $M$ nằm trên mặt cầu.
- $IM>R$: $M$ nằm ngoài mặt cầu.

Với mặt phẳng $(P): Ax+By+Cz+D=0$, khoảng cách từ tâm $I(x_I;y_I;z_I)$ đến $(P)$ là:

$$ d(I,(P))=\frac{|Ax_I+By_I+Cz_I+D|}{\sqrt{A^2+B^2+C^2}}. $$

So sánh $d$ với $R$ để xét tương giao giữa mặt cầu và mặt phẳng.

## II. Phương pháp làm nhanh

Khi gặp phương trình mặt cầu dạng chuẩn, ta đọc ngay tâm và bán kính: đổi dấu trong các biểu thức $(x-a)$, $(y-b)$, $(z-c)$ để lấy tọa độ tâm, còn vế phải là $R^2$.

Khi gặp dạng tổng quát, nên nhóm và hoàn thành bình phương:

$$ x^2+2Ax=(x+A)^2-A^2. $$

Tương tự cho $y,z$, rồi đưa về dạng chuẩn. Cách này giúp tránh nhầm dấu khi xác định tâm.

Muốn viết phương trình mặt cầu, cần tìm tâm và bán kính. Nếu biết tâm $I(a;b;c)$ và đi qua điểm $M$, ta có $R=IM$. Nếu biết đường kính $AB$, tâm là trung điểm $I$ của $AB$ và bán kính $R=\frac{AB}{2}$. Nếu biết mặt cầu tiếp xúc với mặt phẳng $(P)$, bán kính chính là khoảng cách từ tâm đến mặt phẳng: $R=d(I,(P))$.

Xét tương giao mặt cầu với mặt phẳng $(P)$: tính $d=d(I,(P))$.

- Nếu $d>R$: không cắt.
- Nếu $d=R$: tiếp xúc tại một điểm.
- Nếu $d<R$: cắt theo một đường tròn.

Khi cắt theo đường tròn, bán kính đường tròn giao tuyến là:

$$ r=\sqrt{R^2-d^2}. $$

Xét tương giao hai mặt cầu $(S_1),(S_2)$ có tâm $I_1,I_2$, bán kính $R_1,R_2$, đặt $d=I_1I_2$:

- $d>R_1+R_2$: hai mặt cầu rời nhau.
- $d=R_1+R_2$: tiếp xúc ngoài.
- $|R_1-R_2|<d<R_1+R_2$: cắt nhau theo một đường tròn.
- $d=|R_1-R_2|$: tiếp xúc trong.
- $d<|R_1-R_2|$: một mặt cầu nằm trong mặt cầu kia, không cắt.

## III. Ví dụ minh họa

**Ví dụ 1.** Xác định tâm, bán kính của mặt cầu:

$$ x^2+y^2+z^2-4x+6y-2z-11=0. $$

Ta có $2A=-4 \Rightarrow A=-2$, $2B=6 \Rightarrow B=3$, $2C=-2 \Rightarrow C=-1$, $D=-11$.

Suy ra tâm:

$$ I(2;-3;1). $$

Bán kính:

$$ R=\sqrt{(-2)^2+3^2+(-1)^2-(-11)}=\sqrt{25}=5. $$

Vậy mặt cầu có tâm $I(2;-3;1)$, bán kính $R=5$.

**Ví dụ 2.** Viết phương trình mặt cầu tâm $I(1;-2;3)$ đi qua $M(3;0;4)$.

Ta có:

$$ R^2=IM^2=(3-1)^2+(0+2)^2+(4-3)^2=4+4+1=9. $$

Vậy phương trình mặt cầu là:

$$ (x-1)^2+(y+2)^2+(z-3)^2=9. $$

**Ví dụ 3.** Xét vị trí tương đối của mặt cầu $(S): (x-1)^2+y^2+(z+2)^2=16$ và mặt phẳng $(P): 2x-y+2z+5=0$.

Mặt cầu có tâm $I(1;0;-2)$, bán kính $R=4$. Khoảng cách từ $I$ đến $(P)$ là:

$$ d=\frac{|2\cdot1-0+2\cdot(-2)+5|}{\sqrt{2^2+(-1)^2+2^2}}=\frac{3}{3}=1. $$

Vì $d<R$, mặt phẳng cắt mặt cầu theo một đường tròn. Bán kính đường tròn giao tuyến:

$$ r=\sqrt{16-1}=\sqrt{15}. $$

## IV. Chú ý tránh sai

Không được quên điều kiện hệ số của $x^2,y^2,z^2$ phải bằng nhau và cùng dấu khi nhận dạng mặt cầu. Nếu phương trình có dạng $2x^2+2y^2+2z^2+\cdots=0$, cần chia cả phương trình cho $2$ trước khi dùng công thức.

Khi đọc tâm từ dạng tổng quát, dấu rất dễ nhầm. Với $x^2+2Ax$, tọa độ tâm theo trục $x$ là $-A$, không phải $A$.

Bán kính phải là số dương. Nếu tính được $R^2$, cần lấy $R=\sqrt{R^2}$, không để bán kính âm.

Khi xét tương giao với mặt phẳng, phải tính khoảng cách từ tâm đến mặt phẳng, không lấy khoảng cách từ một điểm bất kỳ trên mặt cầu. Khi xét hai mặt cầu, cần so sánh khoảng cách hai tâm với tổng và hiệu hai bán kính.

#### Quy tắc chính

- Dạng chuẩn: tâm là các số đổi dấu trong ngoặc, bán kính là căn của vế phải.
- Dạng tổng quát: $I(-A;-B;-C)$ và $R=\sqrt{A^2+B^2+C^2-D}$.
- Mặt phẳng tiếp xúc mặt cầu khi $d(I,(P))=R$.
- Mặt phẳng cắt mặt cầu theo đường tròn khi $d(I,(P))<R$.
- Hai mặt cầu cắt nhau khi $|R_1-R_2|<I_1I_2<R_1+R_2$.

#### Lỗi thường gặp

- Sai: Lấy tâm của $x^2+y^2+z^2+2Ax+2By+2Cz+D=0$ là $(A;B;C)$ -> Đúng: Tâm là $(-A;-B;-C)$.
- Sai: Quên chia phương trình khi hệ số $x^2,y^2,z^2$ không bằng $1$ -> Đúng: Chia cả phương trình để đưa về hệ số $1$ trước khi áp dụng công thức.
- Sai: Kết luận là mặt cầu dù $R^2<0$ -> Đúng: Phải kiểm tra $A^2+B^2+C^2-D>0$.
- Sai: Xét mặt phẳng cắt mặt cầu bằng cách thay điểm tùy ý -> Đúng: Tính khoảng cách từ tâm mặt cầu đến mặt phẳng rồi so sánh với bán kính.

---

### 33. Vị trí tương đối giữa các đối tượng trong Oxyz

- ID: `80110d2e-a045-5ec7-9679-1e04898ff4e1`
- Chủ đề: Phương trình và hình học Oxyz
- Mức độ: `thong_hieu`
- Số bài tập: 10

## I. Công thức & định nghĩa cốt lõi

Trong không gian $Oxyz$, ta thường xét vị trí tương đối giữa điểm, đường thẳng, mặt phẳng và mặt cầu bằng cách dùng tọa độ, vectơ chỉ phương, vectơ pháp tuyến và khoảng cách.

Điểm $M(x_0;y_0;z_0)$ thuộc mặt phẳng $(P): ax+by+cz+d=0$ khi và chỉ khi
$$ax_0+by_0+cz_0+d=0.$$
Nếu khác $0$ thì $M$ không thuộc $(P)$.

Khoảng cách từ điểm $M(x_0;y_0;z_0)$ đến mặt phẳng $(P)$ là
$$d(M,(P))=\frac{|ax_0+by_0+cz_0+d|}{\sqrt{a^2+b^2+c^2}}.$$

Đường thẳng $d$ thường có dạng tham số:
$$\begin{cases}x=x_0+at\\y=y_0+bt\\z=z_0+ct\end{cases}$$
với vectơ chỉ phương $\vec{u}=(a;b;c)$. Mặt phẳng $(P)$ có vectơ pháp tuyến $\vec{n}=(A;B;C)$.

Vị trí giữa đường thẳng $d$ và mặt phẳng $(P)$ dựa vào tích vô hướng $\vec{u}\cdot \vec{n}$:
- Nếu $\vec{u}\cdot\vec{n}\ne 0$ thì $d$ cắt $(P)$ tại một điểm.
- Nếu $\vec{u}\cdot\vec{n}=0$ và một điểm của $d$ thuộc $(P)$ thì $d\subset(P)$.
- Nếu $\vec{u}\cdot\vec{n}=0$ và điểm đó không thuộc $(P)$ thì $d\parallel(P)$.

Mặt cầu $(S)$ có dạng
$$(x-a)^2+(y-b)^2+(z-c)^2=R^2,$$
tâm $I(a;b;c)$, bán kính $R>0$. Với mặt phẳng $(P)$, xét khoảng cách $h=d(I,(P))$:
- $h<R$: $(P)$ cắt mặt cầu theo một đường tròn.
- $h=R$: $(P)$ tiếp xúc mặt cầu.
- $h>R$: $(P)$ không cắt mặt cầu.

Với điểm $M$, so sánh $IM$ với $R$: $IM<R$ thì $M$ nằm trong mặt cầu, $IM=R$ thì $M$ thuộc mặt cầu, $IM>R$ thì $M$ nằm ngoài mặt cầu.

## II. Phương pháp làm nhanh

Bước 1: Nhận dạng đối tượng. Nếu đề cho phương trình bậc nhất theo $x,y,z$, đó là mặt phẳng. Nếu có tham số $t$, thường là đường thẳng. Nếu có dạng tổng bình phương bằng hằng số dương, đó là mặt cầu.

Bước 2: Lấy dữ kiện đặc trưng. Với đường thẳng, lấy một điểm $M_0$ và vectơ chỉ phương $\vec{u}$. Với mặt phẳng, lấy vectơ pháp tuyến $\vec{n}$. Với mặt cầu, xác định tâm $I$ và bán kính $R$.

Bước 3: Dùng tiêu chí ngắn nhất. Muốn xét điểm thuộc mặt phẳng thì thay tọa độ. Muốn xét đường thẳng với mặt phẳng thì tính $\vec{u}\cdot\vec{n}$. Muốn xét mặt phẳng với mặt cầu thì tính khoảng cách từ tâm đến mặt phẳng.

Bước 4: Kết luận đúng ngôn ngữ hình học. Không chỉ ghi kết quả tính toán, cần nói rõ: cắt, song song, nằm trong, tiếp xúc, không giao nhau hoặc thuộc.

## III. Ví dụ minh họa

Ví dụ 1. Xét đường thẳng
$$d:\begin{cases}x=1+2t\\y=-1+t\\z=3-t\end{cases}$$
và mặt phẳng $(P): x+y+3z-9=0$.

Ta có $\vec{u}=(2;1;-1)$, $\vec{n}=(1;1;3)$. Khi đó
$$\vec{u}\cdot\vec{n}=2\cdot1+1\cdot1+(-1)\cdot3=0.$$
Lấy điểm $M_0(1;-1;3)$ thuộc $d$. Thay vào $(P)$:
$$1+(-1)+3\cdot3-9=0.$$
Vậy $M_0\in(P)$. Do $\vec{u}\cdot\vec{n}=0$ và có một điểm của $d$ thuộc $(P)$ nên $d\subset(P)$.

Ví dụ 2. Cho mặt cầu $(S):(x-1)^2+(y+2)^2+(z-3)^2=25$ và mặt phẳng $(Q):2x-y+2z-10=0$.

Tâm $I(1;-2;3)$, bán kính $R=5$. Khoảng cách từ $I$ đến $(Q)$ là
$$d(I,(Q))=\frac{|2\cdot1-(-2)+2\cdot3-10|}{\sqrt{2^2+(-1)^2+2^2}}=\frac{|0|}{3}=0.$$
Vì $0<5$, mặt phẳng $(Q)$ cắt mặt cầu $(S)$ theo một đường tròn.

## IV. Chú ý tránh sai

Khi xét đường thẳng và mặt phẳng, không được chỉ nhìn vectơ chỉ phương và vectơ pháp tuyến rồi kết luận vội. Nếu $\vec{u}\cdot\vec{n}=0$, vẫn phải kiểm tra một điểm của đường thẳng có thuộc mặt phẳng hay không để phân biệt song song và nằm trong.

Khi xét mặt cầu, cần đưa phương trình về dạng chuẩn. Nếu phương trình có dạng khai triển, phải hoàn thành bình phương để tìm đúng tâm và bán kính.

Khoảng cách luôn không âm vì có dấu giá trị tuyệt đối. Nếu quên dấu trị tuyệt đối, kết quả có thể âm và dẫn đến kết luận sai.

Với bài trắc nghiệm, nên ưu tiên tiêu chí so sánh: thay điểm, tính tích vô hướng, tính khoảng cách. Đây là ba thao tác nhanh nhất để nhận biết vị trí tương đối trong không gian.

#### Quy tắc chính

- Điểm thuộc mặt phẳng khi thay tọa độ vào phương trình được $0$.
- Đường thẳng cắt mặt phẳng khi $\vec{u}\cdot\vec{n}\ne0$.
- Nếu $\vec{u}\cdot\vec{n}=0$, cần kiểm tra thêm một điểm của đường thẳng.
- Mặt phẳng tiếp xúc mặt cầu khi khoảng cách từ tâm đến mặt phẳng bằng bán kính.
- So sánh $IM$ với $R$ để xác định vị trí của điểm với mặt cầu.

#### Lỗi thường gặp

- Sai: Thấy $\vec{u}\cdot\vec{n}=0$ liền kết luận đường thẳng song song mặt phẳng -> Đúng: Phải kiểm tra đường thẳng có nằm trong mặt phẳng không.
- Sai: Quên dấu giá trị tuyệt đối trong công thức khoảng cách -> Đúng: Luôn dùng $|ax_0+by_0+cz_0+d|$.
- Sai: Nhầm tâm mặt cầu khi phương trình ở dạng khai triển -> Đúng: Hoàn thành bình phương trước khi xác định tâm và bán kính.
- Sai: Kết luận mặt phẳng cắt mặt cầu chỉ vì có phương trình chung -> Đúng: So sánh $d(I,(P))$ với $R$.

---

### 34. Bài toán tính khoảng cách trong Oxyz

- ID: `a3649971-3dce-5069-a766-82dd7d143263`
- Chủ đề: Phương trình và hình học Oxyz
- Mức độ: `thong_hieu`
- Số bài tập: 10

## I. Công thức & định nghĩa cốt lõi

Trong không gian $Oxyz$, bài toán khoảng cách thường quy về việc đo độ dài đoạn vuông góc ngắn nhất.

**1. Khoảng cách từ điểm đến mặt phẳng**

Cho điểm $M(x_0,y_0,z_0)$ và mặt phẳng $(P): ax+by+cz+d=0$. Khi đó:

$$d(M,(P))=\frac{|ax_0+by_0+cz_0+d|}{\sqrt{a^2+b^2+c^2}}.$$

Ở đây, véc-tơ pháp tuyến của mặt phẳng là $\vec n=(a,b,c)$.

**2. Khoảng cách từ điểm đến đường thẳng**

Cho đường thẳng $\Delta$ đi qua $A$ và có véc-tơ chỉ phương $\vec u$. Với điểm $M$, ta có:

$$d(M,\Delta)=\frac{|[\vec{AM},\vec u]|}{|\vec u|}.$$

Trong đó $[\vec{AM},\vec u]$ là tích có hướng. Công thức này xuất phát từ diện tích hình bình hành: $S=|\vec{AM}||\vec u|\sin\theta$.

**3. Khoảng cách giữa hai đường thẳng chéo nhau**

Cho $d_1$ đi qua $A$, có véc-tơ chỉ phương $\vec u$; $d_2$ đi qua $B$, có véc-tơ chỉ phương $\vec v$. Nếu $d_1,d_2$ chéo nhau thì:

$$d(d_1,d_2)=\frac{|\vec{AB}\cdot[\vec u,\vec v]|}{|[\vec u,\vec v]|}.$$

Công thức này chỉ dùng khi hai đường không song song. Nếu $[\vec u,\vec v]=\vec 0$ thì hai đường song song hoặc trùng nhau, phải dùng công thức khoảng cách từ một điểm trên đường này đến đường kia.

## II. Phương pháp làm nhanh

Bước 1: Xác định đúng đối tượng cần tính khoảng cách: điểm - mặt phẳng, điểm - đường thẳng, hay hai đường thẳng.

Bước 2: Lấy đủ dữ kiện hình học. Với mặt phẳng cần phương trình tổng quát. Với đường thẳng cần một điểm thuộc đường và một véc-tơ chỉ phương.

Bước 3: Chọn công thức phù hợp. Nếu tính khoảng cách từ điểm đến đường, hãy lập véc-tơ nối từ điểm trên đường đến điểm đã cho. Nếu tính khoảng cách hai đường chéo nhau, hãy lập $\vec{AB}$ nối một điểm trên đường thứ nhất đến một điểm trên đường thứ hai.

Bước 4: Kiểm tra điều kiện trước khi thay số. Đặc biệt, với hai đường thẳng, cần xem $[\vec u,\vec v]$ có bằng $\vec 0$ không. Nếu bằng $\vec 0$, không được dùng công thức đường chéo nhau.

Mẹo làm nhanh: trong bài trắc nghiệm, có thể ưu tiên tìm véc-tơ chỉ phương và véc-tơ pháp tuyến thật chính xác, vì sai dấu ở bước này thường làm hỏng toàn bài. Tuy nhiên, với công thức có trị tuyệt đối, đổi chiều véc-tơ thường không làm đổi kết quả.

## III. Ví dụ minh họa

**Ví dụ 1.** Tính khoảng cách từ $M(1,-2,3)$ đến mặt phẳng $(P): 2x-y+2z-5=0$.

Ta có $a=2,b=-1,c=2,d=-5$. Suy ra:

$$d(M,(P))=\frac{|2\cdot1-(-2)+2\cdot3-5|}{\sqrt{2^2+(-1)^2+2^2}}=\frac{|2+2+6-5|}{3}=\frac{5}{3}.$$

Vậy khoảng cách cần tìm là $\frac{5}{3}$.

**Ví dụ 2.** Cho đường thẳng $\Delta$ đi qua $A(1,0,2)$, có véc-tơ chỉ phương $\vec u=(2,-1,2)$. Tính khoảng cách từ $M(3,1,1)$ đến $\Delta$.

Ta có $\vec{AM}=(2,1,-1)$. Tính tích có hướng:

$$[\vec{AM},\vec u]=(1,-6,-4).$$

Do đó:

$$d(M,\Delta)=\frac{\sqrt{1^2+(-6)^2+(-4)^2}}{\sqrt{2^2+(-1)^2+2^2}}=\frac{\sqrt{53}}{3}.$$

**Ví dụ 3.** Cho $d_1$ qua $A(0,0,1)$, $\vec u=(1,1,0)$; $d_2$ qua $B(1,0,0)$, $\vec v=(0,1,1)$. Tính khoảng cách giữa hai đường thẳng.

Ta có $\vec{AB}=(1,0,-1)$ và

$$[\vec u,\vec v]=(1,-1,1).$$

Suy ra:

$$d(d_1,d_2)=\frac{|(1,0,-1)\cdot(1,-1,1)|}{\sqrt{1^2+(-1)^2+1^2}}=\frac{|1-1|}{\sqrt3}=0.$$

Kết quả $0$ cho thấy hai đường không chéo nhau mà cắt nhau. Vì vậy cần kiểm tra quan hệ hai đường trước khi kết luận bài toán khoảng cách chéo nhau.

## IV. Chú ý tránh sai

Không phải cứ có hai đường thẳng trong không gian là dùng công thức chéo nhau. Cần phân biệt: cắt nhau thì khoảng cách bằng $0$, song song thì đưa về khoảng cách từ điểm đến đường, chéo nhau mới dùng tích hỗn tạp.

Khi tính khoảng cách từ điểm đến mặt phẳng, bắt buộc phương trình mặt phẳng phải ở dạng $ax+by+cz+d=0$. Nếu để dạng chưa chuyển vế, rất dễ thay sai hệ số $d$.

Với khoảng cách từ điểm đến đường, véc-tơ $\vec{AM}$ phải nối từ một điểm $A$ thuộc đường đến điểm $M$ ngoài đường. Nếu chọn nhầm điểm không thuộc đường, kết quả sẽ sai.

Cuối cùng, khoảng cách luôn không âm, nên tử số của công thức thường có dấu giá trị tuyệt đối. Nếu ra kết quả âm, chắc chắn đã quên trị tuyệt đối hoặc hiểu sai ý nghĩa hình học.

#### Quy tắc chính

- Điểm đến mặt phẳng: dùng phương trình $ax+by+cz+d=0$.
- Điểm đến đường thẳng: cần một điểm thuộc đường và véc-tơ chỉ phương.
- Hai đường chéo nhau: dùng tích hỗn tạp $\vec{AB}\cdot[\vec u,\vec v]$.
- Luôn kiểm tra hai đường có song song, cắt nhau hay chéo nhau trước khi áp dụng công thức.
- Khoảng cách luôn không âm, tử số thường phải có giá trị tuyệt đối.

#### Lỗi thường gặp

- Sai: Dùng công thức hai đường chéo nhau khi $[\vec u,\vec v]=\vec 0$ -> Đúng: Nếu song song, tính khoảng cách từ một điểm trên đường này đến đường kia.
- Sai: Thay điểm vào mặt phẳng khi phương trình chưa đưa về dạng $ax+by+cz+d=0$ -> Đúng: Chuyển hết về một vế rồi mới áp dụng công thức.
- Sai: Lấy nhầm véc-tơ nối trong công thức điểm đến đường -> Đúng: Chọn $\vec{AM}$ với $A$ thuộc đường thẳng và $M$ là điểm đã cho.
- Sai: Bỏ dấu giá trị tuyệt đối làm khoảng cách âm -> Đúng: Luôn lấy trị tuyệt đối ở tử số.

---

### 35. Bài toán tính góc trong không gian Oxyz

- ID: `11ad2f1a-e41f-58f7-a2b5-e50a7f3d48fd`
- Chủ đề: Phương trình và hình học Oxyz
- Mức độ: `thong_hieu`
- Số bài tập: 10

## I. Công thức & định nghĩa cốt lõi

Trong không gian $Oxyz$, các bài toán góc thường quy về việc dùng vectơ chỉ phương và vectơ pháp tuyến.

**1. Góc giữa hai đường thẳng**

Nếu đường thẳng $d_1$ có vectơ chỉ phương $\vec{u}_1=(a_1,b_1,c_1)$, đường thẳng $d_2$ có vectơ chỉ phương $\vec{u}_2=(a_2,b_2,c_2)$, thì góc giữa hai đường thẳng là góc nhọn hoặc vuông, ký hiệu $\varphi$, thỏa mãn:

$$\cos \varphi=\frac{|\vec{u}_1\cdot \vec{u}_2|}{|\vec{u}_1|\,|\vec{u}_2|}.$$

Trong đó:

$$\vec{u}_1\cdot \vec{u}_2=a_1a_2+b_1b_2+c_1c_2.$$

**2. Góc giữa hai mặt phẳng**

Nếu mặt phẳng $(P)$ có vectơ pháp tuyến $\vec{n}_P$, mặt phẳng $(Q)$ có vectơ pháp tuyến $\vec{n}_Q$, thì góc giữa hai mặt phẳng bằng góc giữa hai vectơ pháp tuyến của chúng:

$$\cos \varphi=\frac{|\vec{n}_P\cdot \vec{n}_Q|}{|\vec{n}_P|\,|\vec{n}_Q|}.$$

Với mặt phẳng $Ax+By+Cz+D=0$, một vectơ pháp tuyến là $\vec{n}=(A,B,C)$.

**3. Góc giữa đường thẳng và mặt phẳng**

Nếu đường thẳng $d$ có vectơ chỉ phương $\vec{u}$, mặt phẳng $(P)$ có vectơ pháp tuyến $\vec{n}$, gọi $\alpha$ là góc giữa $d$ và $(P)$. Khi đó:

$$\sin \alpha=\frac{|\vec{u}\cdot \vec{n}|}{|\vec{u}|\,|\vec{n}|}.$$

Lý do dùng sin là vì góc giữa đường thẳng và mặt phẳng phụ với góc giữa vectơ chỉ phương của đường thẳng và vectơ pháp tuyến của mặt phẳng.

## II. Phương pháp làm nhanh

Bước 1: Xác định đúng đối tượng cần tính góc: hai đường thẳng, hai mặt phẳng, hay đường thẳng với mặt phẳng.

Bước 2: Lấy vectơ phù hợp. Với đường thẳng, lấy vectơ chỉ phương $\vec{u}$. Với mặt phẳng, lấy vectơ pháp tuyến $\vec{n}$. Nếu đường thẳng đi qua hai điểm $A,B$, có thể lấy $\vec{AB}$ làm vectơ chỉ phương.

Bước 3: Chọn đúng công thức. Hai đường thẳng và hai mặt phẳng đều dùng công thức cos. Đường thẳng với mặt phẳng dùng công thức sin.

Bước 4: Tính tích vô hướng, độ dài vectơ, sau đó suy ra góc. Nếu đề yêu cầu tính giá trị lượng giác thì thường chỉ cần dừng ở $\cos \varphi$ hoặc $\sin \alpha$.

Một mẹo quan trọng: luôn đặt dấu giá trị tuyệt đối ở tử số để góc nhận được là góc nhọn hoặc góc vuông theo quy ước hình học THPT.

## III. Ví dụ minh họa

**Ví dụ 1.** Cho hai đường thẳng $d_1,d_2$ có vectơ chỉ phương lần lượt là $\vec{u}_1=(1,2,-2)$ và $\vec{u}_2=(2,1,2)$. Tính góc giữa hai đường thẳng.

Ta có:

$$\vec{u}_1\cdot \vec{u}_2=1\cdot2+2\cdot1+(-2)\cdot2=0.$$

Suy ra $\cos \varphi=0$, nên $\varphi=90^\circ$. Vậy hai đường thẳng vuông góc.

**Ví dụ 2.** Cho hai mặt phẳng $(P):x+2y-2z+1=0$ và $(Q):2x-y+2z-3=0$. Tính góc giữa $(P)$ và $(Q)$.

Ta có $\vec{n}_P=(1,2,-2)$, $\vec{n}_Q=(2,-1,2)$.

$$\vec{n}_P\cdot \vec{n}_Q=1\cdot2+2\cdot(-1)+(-2)\cdot2=-4.$$

$$|\vec{n}_P|=3,\quad |\vec{n}_Q|=3.$$

Do đó:

$$\cos \varphi=\frac{|-4|}{3\cdot3}=\frac{4}{9}.$$

Vậy góc giữa hai mặt phẳng thỏa mãn $\cos \varphi=\frac49$.

**Ví dụ 3.** Cho đường thẳng $d$ có vectơ chỉ phương $\vec{u}=(1,2,2)$ và mặt phẳng $(P):2x-y+2z+5=0$. Tính góc giữa $d$ và $(P)$.

Mặt phẳng $(P)$ có vectơ pháp tuyến $\vec{n}=(2,-1,2)$. Khi đó:

$$\vec{u}\cdot \vec{n}=1\cdot2+2\cdot(-1)+2\cdot2=4.$$

$$|\vec{u}|=3,\quad |\vec{n}|=3.$$

Suy ra:

$$\sin \alpha=\frac{|4|}{3\cdot3}=\frac49.$$

Vậy góc giữa đường thẳng và mặt phẳng thỏa mãn $\sin \alpha=\frac49$.

## IV. Chú ý tránh sai

Không nhầm vectơ chỉ phương với vectơ pháp tuyến. Đường thẳng dùng vectơ chỉ phương, mặt phẳng dùng vectơ pháp tuyến.

Không bỏ dấu giá trị tuyệt đối trong công thức tính góc. Nếu bỏ dấu giá trị tuyệt đối, có thể thu được góc tù, không đúng với quy ước góc giữa hai đối tượng hình học.

Không dùng nhầm công thức cos cho góc giữa đường thẳng và mặt phẳng. Trường hợp này phải dùng sin của góc cần tìm.

Nếu hai vectơ có tích vô hướng bằng $0$, cần kết luận đúng: hai đường thẳng vuông góc, hai mặt phẳng vuông góc, hoặc đường thẳng song song với mặt phẳng tùy từng tình huống.

#### Quy tắc chính

- Hai đường thẳng: dùng vectơ chỉ phương và công thức cos.
- Hai mặt phẳng: dùng vectơ pháp tuyến và công thức cos.
- Đường thẳng với mặt phẳng: dùng vectơ chỉ phương, pháp tuyến và công thức sin.
- Luôn lấy giá trị tuyệt đối của tích vô hướng khi tính góc.
- Góc giữa các đối tượng hình học thường là góc nhọn hoặc vuông.

#### Lỗi thường gặp

- Sai: Dùng vectơ pháp tuyến cho đường thẳng -> Đúng: Đường thẳng phải dùng vectơ chỉ phương.
- Sai: Tính góc giữa đường thẳng và mặt phẳng bằng cos trực tiếp -> Đúng: Dùng $\sin \alpha=\frac{|\vec{u}\cdot\vec{n}|}{|\vec{u}||\vec{n}|}$.
- Sai: Bỏ dấu giá trị tuyệt đối làm ra góc tù -> Đúng: Lấy trị tuyệt đối để được góc nhọn hoặc vuông.
- Sai: Lấy cả hệ số tự do $D$ làm thành phần vectơ pháp tuyến -> Đúng: Với $Ax+By+Cz+D=0$, pháp tuyến là $(A,B,C)$.

---

### 36. Hình chiếu vuông góc và điểm đối xứng

- ID: `7d047d48-20fa-53c1-b4a5-3987f16943d4`
- Chủ đề: Phương trình và hình học Oxyz
- Mức độ: `thong_hieu`
- Số bài tập: 10

## I. Công thức & định nghĩa cốt lõi

Trong hình học giải tích, **hình chiếu vuông góc** của điểm $M$ lên đường thẳng, mặt phẳng là điểm $H$ sao cho $H$ thuộc đối tượng đó và $MH$ vuông góc với đối tượng đó. Điểm $M'$ là **điểm đối xứng** của $M$ qua đường thẳng hoặc mặt phẳng nếu đối tượng đó là trung trực của đoạn $MM'$, tức là hình chiếu $H$ của $M$ nằm giữa $M, M'$ và $H$ là trung điểm của $MM'$.

Trong mặt phẳng $Oxy$, với đường thẳng $d: ax+by+c=0$, hình chiếu $H(x_H,y_H)$ của $M(x_0,y_0)$ lên $d$ được tính nhanh bởi:

$$x_H=x_0-a\frac{ax_0+by_0+c}{a^2+b^2},\quad y_H=y_0-b\frac{ax_0+by_0+c}{a^2+b^2}.$$

Điểm đối xứng $M'(x',y')$ của $M$ qua $d$ thỏa mãn $H$ là trung điểm của $MM'$:

$$x'=2x_H-x_0,\quad y'=2y_H-y_0.$$

Trong không gian $Oxyz$, với mặt phẳng $(P): ax+by+cz+d=0$, hình chiếu $H$ của $M(x_0,y_0,z_0)$ lên $(P)$ là:

$$H=M-\frac{ax_0+by_0+cz_0+d}{a^2+b^2+c^2}(a,b,c).$$

Nếu cần tìm điểm đối xứng $M'$ của $M$ qua mặt phẳng $(P)$ thì dùng:

$$M'=2H-M.$$

Với hình chiếu của điểm $M$ lên đường thẳng trong không gian, nếu đường thẳng $\Delta$ có dạng tham số $A+t\vec u$, ta đặt $H=A+t\vec u$, rồi dùng điều kiện $\overrightarrow{MH}\cdot \vec u=0$ để tìm $t$.

## II. Phương pháp làm nhanh

Bước 1: Xác định đối tượng chiếu là đường thẳng hay mặt phẳng. Nếu là phương trình tổng quát, lấy ngay vectơ pháp tuyến; nếu là đường thẳng tham số, lấy vectơ chỉ phương.

Bước 2: Viết dạng điểm hình chiếu. Với đường thẳng tham số, đặt $H=A+t\vec u$. Với mặt phẳng hoặc đường thẳng dạng tổng quát, có thể dùng công thức chiếu nhanh.

Bước 3: Dùng điều kiện vuông góc. Cốt lõi là đoạn nối từ điểm ban đầu đến hình chiếu phải vuông góc với đối tượng: $\overrightarrow{MH}\cdot \vec u=0$ với đường thẳng, hoặc $\overrightarrow{MH}$ song song vectơ pháp tuyến với mặt phẳng.

Bước 4: Nếu bài hỏi điểm đối xứng, không làm lại từ đầu. Sau khi có hình chiếu $H$, dùng công thức trung điểm: $M'=2H-M$.

## III. Ví dụ minh họa

**Ví dụ 1.** Tìm hình chiếu vuông góc của $M(2,-1)$ lên đường thẳng $d: 3x-4y+5=0$.

Ta có $a=3,b=-4,c=5$. Tính:

$$ax_0+by_0+c=3\cdot2+(-4)(-1)+5=15,$$

$$a^2+b^2=3^2+(-4)^2=25.$$

Suy ra:

$$x_H=2-3\cdot\frac{15}{25}=\frac15,$$

$$y_H=-1-(-4)\cdot\frac{15}{25}=\frac75.$$

Vậy $H\left(\frac15,\frac75\right)$.

Nếu hỏi điểm đối xứng $M'$ của $M$ qua $d$, ta có:

$$M'=2H-M=\left(2\cdot\frac15-2,2\cdot\frac75-(-1)\right)=\left(-\frac85,\frac{19}{5}\right).$$

**Ví dụ 2.** Trong không gian, tìm hình chiếu của $M(1,2,3)$ lên mặt phẳng $(P): x-2y+2z-5=0$.

Ta có $a=1,b=-2,c=2,d=-5$. Tính:

$$ax_0+by_0+cz_0+d=1-4+6-5=-2,$$

$$a^2+b^2+c^2=1+4+4=9.$$

Do đó:

$$H=M-\frac{-2}{9}(1,-2,2)=\left(1+\frac29,2-\frac49,3+\frac49\right).$$

Vậy:

$$H\left(\frac{11}{9},\frac{14}{9},\frac{31}{9}\right).$$

## IV. Chú ý tránh sai

Không nhầm hình chiếu với giao điểm bất kỳ. Hình chiếu phải vừa thuộc đường thẳng hoặc mặt phẳng, vừa tạo đoạn vuông góc với đối tượng đó. Khi dùng công thức với đường thẳng $ax+by+c=0$, phải thay đúng dấu của $a,b,c$; sai dấu sẽ làm lệch hoàn toàn kết quả. Với điểm đối xứng, luôn tìm hình chiếu trước rồi mới lấy đối xứng qua trung điểm. Ngoài ra, khi làm trong không gian, cần phân biệt vectơ pháp tuyến của mặt phẳng và vectơ chỉ phương của đường thẳng; dùng nhầm hai loại vectơ này là lỗi rất phổ biến.

#### Quy tắc chính

- Hình chiếu H luôn thuộc đường thẳng hoặc mặt phẳng đã cho.
- Đoạn MH phải vuông góc với đối tượng chiếu.
- Điểm đối xứng M' thỏa mãn H là trung điểm của MM'.
- Với mặt phẳng tổng quát, dùng vectơ pháp tuyến để chiếu.
- Với đường thẳng tham số, đặt H theo tham số rồi dùng tích vô hướng bằng 0.

#### Lỗi thường gặp

- Sai: Chỉ tìm giao điểm mà không kiểm tra vuông góc -> Đúng: Luôn dùng điều kiện vuông góc hoặc công thức chiếu.
- Sai: Quên mẫu số $a^2+b^2$ hoặc $a^2+b^2+c^2$ -> Đúng: Luôn bình phương đầy đủ các hệ số pháp tuyến.
- Sai: Tìm điểm đối xứng bằng cách đổi dấu tọa độ tùy ý -> Đúng: Tìm hình chiếu H rồi dùng $M'=2H-M$.
- Sai: Nhầm vectơ chỉ phương với vectơ pháp tuyến -> Đúng: Đường thẳng dùng vectơ chỉ phương, mặt phẳng tổng quát dùng vectơ pháp tuyến.

---

### 37. Các bài toán cực trị tọa độ hình học Oxyz

- ID: `ccec078c-b60e-5b56-8976-5e67a9322de5`
- Chủ đề: Phương trình và hình học Oxyz
- Mức độ: `van_dung`
- Số bài tập: 10

## I. Công thức & định nghĩa cốt lõi

Trong không gian $Oxyz$, nhiều bài toán cực trị yêu cầu tìm điểm $M$ thuộc một đường thẳng, mặt phẳng, mặt cầu hoặc một tập hợp nào đó sao cho khoảng cách hoặc tổng độ dài đạt giá trị nhỏ nhất/lớn nhất.

Khoảng cách giữa hai điểm $A(x_A,y_A,z_A)$ và $B(x_B,y_B,z_B)$ là
$$AB=\sqrt{(x_B-x_A)^2+(y_B-y_A)^2+(z_B-z_A)^2}.$$

Khoảng cách từ điểm $A(x_0,y_0,z_0)$ đến mặt phẳng $(P): ax+by+cz+d=0$ là
$$d(A,(P))=\frac{|ax_0+by_0+cz_0+d|}{\sqrt{a^2+b^2+c^2}}.$$

Nếu $M$ thuộc mặt phẳng $(P)$, điểm $M$ gần $A$ nhất chính là hình chiếu vuông góc của $A$ lên $(P)$. Khi đó $AM_{\min}=d(A,(P))$.

Nếu $M$ thuộc đường thẳng $\Delta$, điểm $M$ gần $A$ nhất là hình chiếu vuông góc của $A$ lên $\Delta$. Có thể tham số hóa $M=M_0+t\vec{u}$ rồi tối thiểu hóa $AM^2$ theo $t$.

Với tổng độ dài, bất đẳng thức tam giác là công cụ rất quan trọng:
$$MA+MB\ge AB,$$
dấu bằng xảy ra khi $M,A,B$ thẳng hàng và $M$ nằm giữa $A,B$. Nếu $M$ bị ràng buộc trên mặt phẳng, thường dùng phép đối xứng điểm qua mặt phẳng để biến tổng gãy khúc thành một đoạn thẳng.

## II. Phương pháp làm nhanh

Bước 1: Xác định tập điểm chứa $M$. Nếu $M$ thuộc đường thẳng, hãy tham số hóa. Nếu $M$ thuộc mặt phẳng, nghĩ ngay đến hình chiếu hoặc đối xứng.

Bước 2: Ưu tiên cực trị của bình phương khoảng cách. Vì $AM\ge0$, nên $AM$ nhỏ nhất khi $AM^2$ nhỏ nhất. Việc bỏ căn giúp biểu thức trở thành tam thức bậc hai dễ xử lý.

Bước 3: Với dạng $MA+MB$ và $M\in(P)$, lấy $A'$ là điểm đối xứng của $A$ qua $(P)$. Khi đó
$$MA+MB=A'M+MB\ge A'B.$$
Dấu bằng xảy ra khi $M$ là giao điểm của đường thẳng $A'B$ với mặt phẳng $(P)$.

Bước 4: Với dạng $|MA-MB|$, dùng bất đẳng thức
$$|MA-MB|\le AB.$$
Dấu bằng xảy ra khi $A,B,M$ thẳng hàng và một điểm nằm ngoài đoạn nối hai điểm còn lại. Cần kiểm tra điều kiện ràng buộc của $M$.

Bước 5: Với điểm $M$ thuộc mặt cầu tâm $I$, bán kính $R$, cực trị của $MA$ thường nằm trên đường thẳng $IA$. Ta có
$$MA_{\min}=|IA-R|,\qquad MA_{\max}=IA+R.$$
Điểm đạt cực trị là giao điểm của mặt cầu với đường thẳng $IA$ theo hướng phù hợp.

## III. Ví dụ minh họa

Ví dụ 1. Cho $A(1,2,3)$ và mặt phẳng $(P): x-2y+2z-5=0$. Tìm $M\in(P)$ sao cho $AM$ nhỏ nhất.

Ta biết $M$ là hình chiếu vuông góc của $A$ lên $(P)$. Gọi pháp tuyến của $(P)$ là $\vec{n}=(1,-2,2)$. Đường thẳng qua $A$ vuông góc $(P)$ có dạng
$$M=A+t\vec{n}=(1+t,2-2t,3+2t).$$
Thay vào phương trình mặt phẳng:
$$(1+t)-2(2-2t)+2(3+2t)-5=0.$$
Rút gọn được $9t-2=0$, nên $t=\frac{2}{9}$. Do đó
$$M\left(\frac{11}{9},\frac{14}{9},\frac{31}{9}\right).$$
Đây là điểm duy nhất làm $AM$ nhỏ nhất.

Ví dụ 2. Cho $A(1,0,2)$, $B(3,2,0)$ và mặt phẳng $(P): z=0$. Tìm $M\in(P)$ sao cho $MA+MB$ nhỏ nhất.

Đối xứng $A$ qua $(P):z=0$ được $A'(1,0,-2)$. Khi đó
$$MA+MB=A'M+MB\ge A'B.$$
Dấu bằng xảy ra khi $M=A'B\cap(P)$. Đường thẳng $A'B$ có tham số
$$(x,y,z)=(1,0,-2)+t(2,2,2).$$
Cho $z=0$ thì $-2+2t=0$, suy ra $t=1$. Vậy
$$M=(3,2,0)=B.$$
Trong trường hợp này $B$ đã nằm trên $(P)$, nên tổng nhỏ nhất bằng $AB$ và đạt tại $M=B$.

## IV. Chú ý tránh sai

Không phải cứ thấy cực trị là đạo hàm. Trong hình học tọa độ $Oxyz$, nhiều bài có lời giải rất nhanh bằng hình chiếu, đối xứng, bất đẳng thức tam giác.

Khi tham số hóa $M$, nên tối ưu $AM^2$ thay vì $AM$. Nếu biểu thức bậc hai $f(t)=at^2+bt+c$ với $a>0$, giá trị nhỏ nhất đạt tại $t=-\frac{b}{2a}$.

Với bài toán tổng độ dài, cần kiểm tra điểm giao tìm được có thật sự thuộc tập ràng buộc hay không. Nếu $M$ thuộc đoạn thẳng, tia hoặc miền giới hạn, có thể điểm cực trị nằm ở biên.

Với bài toán mặt cầu, cần phân biệt rõ min và max. Điểm gần $A$ nhất nằm trên đường thẳng $IA$ về phía gần $A$, còn điểm xa nhất nằm về phía đối diện.

#### Quy tắc chính

- Tối ưu khoảng cách bằng cách tối ưu bình phương khoảng cách.
- Điểm gần nhất từ một điểm đến mặt phẳng hoặc đường thẳng là hình chiếu vuông góc.
- Tổng $MA+MB$ thường xử lý bằng đối xứng và bất đẳng thức tam giác.
- Với mặt cầu, cực trị khoảng cách nằm trên đường thẳng nối tâm cầu với điểm đã cho.
- Luôn kiểm tra điều kiện ràng buộc của điểm đạt cực trị.

#### Lỗi thường gặp

- Sai: Tối ưu trực tiếp biểu thức có căn phức tạp -> Đúng: Chuyển sang tối ưu bình phương khoảng cách khi có thể.
- Sai: Dùng đối xứng nhưng quên tìm giao điểm với mặt phẳng ràng buộc -> Đúng: Sau khi nối điểm đối xứng với điểm còn lại, phải lấy giao với mặt phẳng.
- Sai: Kết luận dấu bằng của bất đẳng thức tam giác mà không kiểm tra thẳng hàng và vị trí điểm -> Đúng: Kiểm tra đầy đủ điều kiện xảy ra dấu bằng.
- Sai: Nhầm điểm gần nhất trên mặt cầu với hình chiếu lên mặt cầu tùy ý -> Đúng: Điểm cực trị phải nằm trên đường thẳng nối tâm cầu và điểm đã cho.

---

## Chương 7: Thống kê & mẫu số liệu ghép nhóm

- Môn: `toan_dai`
- Số bài: 4

### 38. Cách thành lập mẫu số liệu ghép nhóm

- ID: `17d42bf7-d5dc-51a8-aed0-ac4780433ec7`
- Chủ đề: Thống kê số liệu
- Mức độ: `nhan_biet`
- Số bài tập: 10

## I. Công thức & định nghĩa cốt lõi

**Mẫu số liệu ghép nhóm** là cách trình bày một tập dữ liệu thô bằng cách chia các giá trị thành các **nhóm**, thường là các khoảng, rồi đếm xem mỗi nhóm có bao nhiêu giá trị. Mục tiêu là làm cho bảng số liệu gọn hơn, dễ quan sát xu hướng hơn.

Ví dụ dữ liệu thô gồm điểm kiểm tra của nhiều học sinh: $6, 7, 8, 5, 9, 6, 7, 8, 10, 4$. Thay vì liệt kê từng điểm, ta có thể ghép thành các nhóm như $[4;6)$, $[6;8)$, $[8;10]$.

Một bảng mẫu số liệu ghép nhóm thường gồm:

- **Nhóm số liệu**: các khoảng giá trị, ví dụ $[a;b)$.
- **Tần số**: số giá trị thuộc nhóm đó.
- Có thể có thêm **tần suất**, được tính bởi công thức:

$$f_i=\frac{n_i}{n}$$

trong đó $n_i$ là tần số của nhóm thứ $i$, $n$ là tổng số quan sát.

Khi lập nhóm, các khoảng thường có dạng:

$$[a;b), [b;c), [c;d), \ldots$$

Nghĩa là lấy đầu trái, không lấy đầu phải. Riêng nhóm cuối có thể viết dạng $[u;v]$ để chứa giá trị lớn nhất.

## II. Phương pháp làm nhanh

Để thành lập mẫu số liệu ghép nhóm từ tập dữ liệu thô, làm theo các bước sau:

**Bước 1. Xác định giá trị nhỏ nhất và lớn nhất.** Gọi giá trị nhỏ nhất là $x_{\min}$, giá trị lớn nhất là $x_{\max}$. Khoảng biến thiên của dữ liệu là:

$$R=x_{\max}-x_{\min}$$

**Bước 2. Chọn số nhóm hoặc độ dài nhóm.** Ở mức nhận biết, đề bài thường cho sẵn các khoảng nhóm. Nếu chưa cho, ta chọn các khoảng dễ đếm, có độ dài bằng nhau nếu có thể, ví dụ độ dài $2$, $5$, $10$ tùy dữ liệu.

**Bước 3. Lập các khoảng nhóm không chồng lấn.** Các nhóm phải bao phủ toàn bộ dữ liệu và không để một giá trị rơi vào hai nhóm cùng lúc. Cách viết phổ biến là $[a;b)$, nghĩa là $a \le x < b$.

**Bước 4. Đếm tần số.** Duyệt từng giá trị trong tập dữ liệu thô và xếp vào đúng nhóm. Sau đó cộng số lượng ở mỗi nhóm. Tổng các tần số phải bằng tổng số dữ liệu ban đầu.

**Bước 5. Kiểm tra lại bảng.** Đây là bước rất quan trọng: cộng tất cả tần số, nếu không bằng $n$ thì chắc chắn đã đếm thiếu hoặc đếm trùng.

## III. Ví dụ minh họa

Cho số phút tự học Toán trong một ngày của 20 học sinh:

$35, 42, 50, 55, 60, 62, 68, 70, 75, 80, 83, 85, 90, 95, 100, 105, 110, 115, 120, 125$.

Hãy lập mẫu số liệu ghép nhóm theo các nhóm:

$[30;50), [50;70), [70;90), [90;110), [110;130]$.

Ta đếm như sau:

- Nhóm $[30;50)$ gồm các giá trị $35, 42$, nên tần số là $2$.
- Nhóm $[50;70)$ gồm $50, 55, 60, 62, 68$, nên tần số là $5$.
- Nhóm $[70;90)$ gồm $70, 75, 80, 83, 85$, nên tần số là $5$.
- Nhóm $[90;110)$ gồm $90, 95, 100, 105$, nên tần số là $4$.
- Nhóm $[110;130]$ gồm $110, 115, 120, 125$, nên tần số là $4$.

Bảng mẫu số liệu ghép nhóm là:

| Nhóm số liệu | Tần số |
|---|---:|
| $[30;50)$ | $2$ |
| $[50;70)$ | $5$ |
| $[70;90)$ | $5$ |
| $[90;110)$ | $4$ |
| $[110;130]$ | $4$ |

Kiểm tra: $2+5+5+4+4=20$, đúng bằng số học sinh ban đầu. Vậy bảng đã lập đúng.

## IV. Chú ý tránh sai

Khi gặp dạng bài nhận biết, điều quan trọng nhất không phải tính toán phức tạp mà là hiểu đúng quy tắc xếp số liệu vào nhóm. Nếu nhóm là $[50;70)$ thì giá trị $50$ được tính vào nhóm này, nhưng $70$ không thuộc nhóm này mà thuộc nhóm sau. Đây là lỗi rất thường gặp.

Ngoài ra, các nhóm cần liền mạch và không chồng lên nhau. Ví dụ viết $[0;5]$ và $[5;10]$ có thể gây trùng giá trị $5$. Cách an toàn hơn là $[0;5)$ và $[5;10)$.

Cuối cùng, sau khi đếm tần số, luôn cộng lại tổng tần số. Nếu tổng không bằng số phần tử của dữ liệu thô thì bảng chưa đúng.

#### Quy tắc chính

- Mỗi giá trị dữ liệu phải thuộc đúng một nhóm.
- Khoảng $[a;b)$ nghĩa là lấy $a$ nhưng không lấy $b$.
- Tổng các tần số phải bằng số dữ liệu ban đầu.
- Các nhóm nên liền mạch, không bỏ sót và không chồng lấn.
- Nhóm cuối có thể viết dạng đóng để chứa giá trị lớn nhất.

#### Lỗi thường gặp

- Sai: Cho giá trị ở đầu phải vào nhóm $[a;b)$ -> Đúng: Giá trị $b$ thuộc nhóm kế tiếp.
- Sai: Lập các nhóm bị chồng lấn như $[0;5]$, $[5;10]$ -> Đúng: Dùng $[0;5)$, $[5;10)$.
- Sai: Đếm tần số xong không kiểm tra tổng -> Đúng: Luôn cộng tần số và so với số dữ liệu ban đầu.
- Sai: Bỏ sót giá trị nhỏ nhất hoặc lớn nhất -> Đúng: Chọn nhóm bao phủ toàn bộ dữ liệu.

---

### 39. Số trung bình, mốt, trung vị và tứ phân vị

- ID: `6a469768-0719-5a7b-a19b-89af35a03baa`
- Chủ đề: Thống kê số liệu
- Mức độ: `nhan_biet`
- Số bài tập: 10

## I. Công thức & định nghĩa cốt lõi

Các đại lượng đo xu hướng trung tâm giúp mô tả “giá trị tiêu biểu” của một mẫu số liệu.

**1. Số trung bình**

Với dãy số liệu $x_1,x_2,\ldots,x_n$, số trung bình là:

$$\overline{x}=\frac{x_1+x_2+\cdots+x_n}{n}$$

Nếu số liệu có tần số, giá trị $x_i$ xuất hiện $n_i$ lần thì:

$$\overline{x}=\frac{x_1n_1+x_2n_2+\cdots+x_kn_k}{n_1+n_2+\cdots+n_k}$$

Ý nghĩa: số trung bình biểu thị mức độ đại diện chung của toàn bộ dữ liệu, nhưng dễ bị ảnh hưởng bởi giá trị quá lớn hoặc quá nhỏ.

**2. Mốt**

Mốt, kí hiệu $M_o$, là giá trị xuất hiện nhiều nhất trong mẫu số liệu. Một mẫu có thể có một mốt, nhiều mốt hoặc không có mốt nếu các giá trị xuất hiện với tần số bằng nhau.

Ý nghĩa: mốt cho biết giá trị phổ biến nhất, thường dùng khi quan tâm lựa chọn được gặp nhiều nhất.

**3. Trung vị**

Trung vị, kí hiệu $M_e$, là giá trị đứng giữa sau khi sắp xếp số liệu theo thứ tự tăng dần.

Nếu $n$ lẻ, trung vị là số ở vị trí $\frac{n+1}{2}$.

Nếu $n$ chẵn, trung vị là trung bình cộng của hai số ở vị trí $\frac{n}{2}$ và $\frac{n}{2}+1$.

Ý nghĩa: trung vị chia mẫu số liệu thành hai nửa, ít bị ảnh hưởng bởi giá trị bất thường.

**4. Tứ phân vị**

Sau khi sắp xếp số liệu tăng dần, ba tứ phân vị $Q_1,Q_2,Q_3$ chia mẫu thành bốn phần gần bằng nhau. Trong đó $Q_2$ chính là trung vị.

$Q_1$ là trung vị của nửa dưới dữ liệu, $Q_3$ là trung vị của nửa trên dữ liệu. Tứ phân vị giúp nhận biết sự phân tán và vị trí của các nhóm dữ liệu.

## II. Phương pháp làm nhanh

Bước 1: Luôn sắp xếp số liệu theo thứ tự tăng dần nếu cần tìm trung vị hoặc tứ phân vị.

Bước 2: Đếm đúng số phần tử $n$. Nếu dữ liệu có tần số, nên lập bảng gồm giá trị và tần số để tránh bỏ sót.

Bước 3: Tính số trung bình bằng cách lấy tổng các giá trị chia cho số lượng giá trị. Với bảng tần số, nhân từng giá trị với tần số trước rồi mới cộng.

Bước 4: Tìm mốt bằng cách nhìn tần số lớn nhất, không lấy nhầm giá trị lớn nhất.

Bước 5: Tìm trung vị trước, sau đó chia hai nửa dữ liệu để tìm $Q_1$ và $Q_3$. Khi $n$ lẻ, thường không đưa trung vị vào hai nửa khi tìm $Q_1,Q_3$ theo chương trình phổ thông.

## III. Ví dụ minh họa

Cho mẫu số liệu điểm kiểm tra của 9 học sinh:

$6,8,7,9,6,5,8,10,8$.

Sắp xếp tăng dần:

$5,6,6,7,8,8,8,9,10$.

Số trung bình:

$$\overline{x}=\frac{5+6+6+7+8+8+8+9+10}{9}=\frac{67}{9}\approx 7{,}44$$

Mốt là $8$ vì $8$ xuất hiện 3 lần, nhiều nhất trong mẫu.

Vì $n=9$ là số lẻ nên trung vị là giá trị ở vị trí $\frac{9+1}{2}=5$. Do đó $M_e=8$.

Tìm tứ phân vị: bỏ trung vị ở vị trí thứ 5, nửa dưới là $5,6,6,7$, nửa trên là $8,8,9,10$.

$$Q_1=\frac{6+6}{2}=6$$

$$Q_2=M_e=8$$

$$Q_3=\frac{8+9}{2}=8{,}5$$

Ý nghĩa: điểm trung bình khoảng $7{,}44$, điểm phổ biến nhất là $8$, một nửa số học sinh có điểm không vượt quá $8$, và khoảng 25% số điểm không vượt quá $6$.

## IV. Chú ý tránh sai

Không tìm trung vị khi dữ liệu chưa sắp xếp. Đây là lỗi rất thường gặp.

Không nhầm mốt với số trung bình hoặc giá trị lớn nhất. Mốt là giá trị có tần số xuất hiện lớn nhất.

Với số trung bình của bảng tần số, không được cộng các giá trị đại diện rồi chia cho số loại giá trị; phải tính theo tần số.

Khi tìm tứ phân vị, cần xác định rõ cách chia nửa dữ liệu. Trong bài thi THPT, nên làm theo quy ước sách giáo khoa và trình bày rõ ràng.

#### Quy tắc chính

- Số trung bình bằng tổng các giá trị chia cho số phần tử.
- Mốt là giá trị xuất hiện nhiều nhất, không phải giá trị lớn nhất.
- Trung vị phải được tìm sau khi sắp xếp dữ liệu tăng dần.
- $Q_2$ chính là trung vị của mẫu số liệu.
- Tứ phân vị chia dữ liệu đã sắp xếp thành bốn phần gần bằng nhau.

#### Lỗi thường gặp

- Sai: Tìm trung vị trên dãy chưa sắp xếp -> Đúng: Sắp xếp tăng dần rồi mới xác định vị trí giữa.
- Sai: Lấy mốt là số lớn nhất trong mẫu -> Đúng: Lấy giá trị có tần số xuất hiện lớn nhất.
- Sai: Tính trung bình bảng tần số bằng cách cộng các giá trị rồi chia cho số loại giá trị -> Đúng: Nhân mỗi giá trị với tần số rồi chia cho tổng tần số.
- Sai: Khi $n$ chẵn chỉ lấy một số ở giữa làm trung vị -> Đúng: Lấy trung bình cộng của hai số đứng giữa.

---

### 40. Khoảng biến thiên, phương sai, độ lệch chuẩn

- ID: `8058f49c-371e-5428-8045-da9a2ddc811b`
- Chủ đề: Thống kê số liệu
- Mức độ: `nhan_biet`
- Số bài tập: 10

## I. Công thức & định nghĩa cốt lõi

Trong thống kê, các đại lượng đo mức độ phân tán cho biết dữ liệu **dao động nhiều hay ít** quanh giá trị trung tâm. Ở mức nhận biết, ta cần nhớ đúng khái niệm và công thức tính.

**1. Khoảng biến thiên**

Khoảng biến thiên, kí hiệu $R$, là hiệu giữa giá trị lớn nhất và giá trị nhỏ nhất của mẫu số liệu:

$$R=x_{\max}-x_{\min}.$$

Đại lượng này cho biết toàn bộ dữ liệu trải rộng trên một đoạn dài bao nhiêu. Nếu $R$ càng lớn thì dữ liệu càng phân tán.

**2. Khoảng tứ phân vị**

Khoảng tứ phân vị, kí hiệu $\Delta_Q$, là hiệu giữa tứ phân vị thứ ba và tứ phân vị thứ nhất:

$$\Delta_Q=Q_3-Q_1.$$

Trong đó $Q_1$ là tứ phân vị dưới, $Q_3$ là tứ phân vị trên. Khoảng tứ phân vị phản ánh độ phân tán của **50\% số liệu ở giữa**, nên ít bị ảnh hưởng bởi các giá trị quá lớn hoặc quá nhỏ.

**3. Phương sai**

Với mẫu số liệu $x_1,x_2,\ldots,x_n$ có số trung bình là $\overline{x}$, phương sai được tính bởi:

$$s^2=\frac{1}{n}\sum_{i=1}^{n}(x_i-\overline{x})^2.$$

Có thể hiểu phương sai là trung bình cộng của các bình phương độ lệch so với số trung bình.

**4. Độ lệch chuẩn**

Độ lệch chuẩn là căn bậc hai của phương sai:

$$s=\sqrt{s^2}.$$

Độ lệch chuẩn có cùng đơn vị với số liệu ban đầu, nên thường dễ hiểu hơn phương sai.

## II. Phương pháp làm nhanh

Bước 1: Sắp xếp số liệu theo thứ tự tăng dần. Việc này đặc biệt quan trọng khi tính $R$, $Q_1$, $Q_3$.

Bước 2: Tính khoảng biến thiên bằng cách lấy số lớn nhất trừ số nhỏ nhất. Không cần dùng tất cả dữ liệu.

Bước 3: Tìm $Q_1$ và $Q_3$ theo quy tắc tứ phân vị đã học. Sau đó lấy $Q_3-Q_1$ để được khoảng tứ phân vị.

Bước 4: Muốn tính phương sai, trước hết tính số trung bình $\overline{x}$. Sau đó lập các độ lệch $x_i-\overline{x}$, bình phương chúng rồi lấy trung bình cộng.

Bước 5: Muốn tính độ lệch chuẩn, chỉ cần lấy căn bậc hai của phương sai. Nếu đề yêu cầu làm tròn, cần đọc kỹ yêu cầu làm tròn đến hàng phần mười, phần trăm hay chữ số thập phân thứ mấy.

Mẹo nhận biết nhanh: nếu đề hỏi “độ trải rộng lớn nhất” thì nghĩ đến khoảng biến thiên; nếu hỏi “50\% dữ liệu trung tâm” thì nghĩ đến khoảng tứ phân vị; nếu có cụm “bình phương độ lệch” thì nghĩ đến phương sai; nếu hỏi đại lượng cùng đơn vị với dữ liệu thì nghĩ đến độ lệch chuẩn.

## III. Ví dụ minh họa

Cho mẫu số liệu về điểm kiểm tra của 7 học sinh:

$$4,\ 6,\ 6,\ 7,\ 8,\ 9,\ 10.$$

Dữ liệu đã được sắp xếp tăng dần.

**Khoảng biến thiên:**

$$R=10-4=6.$$

Vậy khoảng biến thiên là $6$.

**Khoảng tứ phân vị:**

Với 7 số liệu, trung vị là số đứng giữa, tức $7$. Nửa dưới gồm $4,6,6$ nên $Q_1=6$. Nửa trên gồm $8,9,10$ nên $Q_3=9$.

Do đó:

$$\Delta_Q=Q_3-Q_1=9-6=3.$$

**Phương sai:**

Số trung bình là:

$$\overline{x}=\frac{4+6+6+7+8+9+10}{7}=\frac{50}{7}.$$

Phương sai:

$$s^2=\frac{1}{7}\left[\left(4-\frac{50}{7}\right)^2+\left(6-\frac{50}{7}\right)^2+\cdots+\left(10-\frac{50}{7}\right)^2\right].$$

Tính gần đúng được:

$$s^2\approx 3,92.$$

**Độ lệch chuẩn:**

$$s=\sqrt{3,92}\approx 1,98.$$

Như vậy, mẫu số liệu có khoảng biến thiên $6$, khoảng tứ phân vị $3$, phương sai xấp xỉ $3,92$ và độ lệch chuẩn xấp xỉ $1,98$.

## IV. Chú ý tránh sai

Không được nhầm khoảng biến thiên với khoảng tứ phân vị. Khoảng biến thiên dùng hai giá trị ngoài cùng, còn khoảng tứ phân vị dùng $Q_1$ và $Q_3$.

Khi tính phương sai, bắt buộc phải bình phương các độ lệch $x_i-\overline{x}$. Nếu chỉ cộng các độ lệch thì tổng thường bằng $0$, không phản ánh được độ phân tán.

Độ lệch chuẩn không phải là phương sai. Độ lệch chuẩn là căn bậc hai của phương sai, tức $s=\sqrt{s^2}$.

Khi dữ liệu có giá trị bất thường, khoảng biến thiên có thể rất lớn, còn khoảng tứ phân vị thường ổn định hơn. Vì vậy cần đọc kỹ đề để chọn đúng đại lượng cần tính.

#### Quy tắc chính

- Khoảng biến thiên: $R=x_{\max}-x_{\min}$.
- Khoảng tứ phân vị: $\Delta_Q=Q_3-Q_1$.
- Phương sai là trung bình các bình phương độ lệch so với $\overline{x}$.
- Độ lệch chuẩn là căn bậc hai của phương sai.
- Luôn sắp xếp số liệu tăng dần trước khi tìm tứ phân vị.

#### Lỗi thường gặp

- Sai: Lấy $Q_3+Q_1$ để tính khoảng tứ phân vị -> Đúng: Phải lấy $Q_3-Q_1$.
- Sai: Tính phương sai bằng trung bình các độ lệch $x_i-\overline{x}$ -> Đúng: Phải bình phương từng độ lệch rồi mới lấy trung bình.
- Sai: Coi phương sai và độ lệch chuẩn là một -> Đúng: Độ lệch chuẩn bằng $\sqrt{s^2}$.
- Sai: Không sắp xếp số liệu trước khi tìm $Q_1,Q_3$ -> Đúng: Phải sắp xếp tăng dần trước.

---

### 41. Phân tích và đọc hiểu số liệu thống kê thực tế

- ID: `135171ae-d412-5cb8-baa0-64d728df7d36`
- Chủ đề: Thống kê số liệu
- Mức độ: `thong_hieu`
- Số bài tập: 10

## I. Công thức & định nghĩa cốt lõi

Trong các bài toán thống kê thực tế, ta không chỉ tính số trung bình mà còn phải đọc hiểu dữ liệu, so sánh mức độ ổn định và đánh giá rủi ro. Một tập dữ liệu có thể có trung bình cao nhưng biến động lớn, nghĩa là kết quả khó dự đoán và rủi ro cao hơn.

Các đại lượng thường dùng:

- **Số trung bình cộng**: nếu dữ liệu là $x_1,x_2,\ldots,x_n$ thì
$$\overline{x}=\frac{x_1+x_2+\cdots+x_n}{n}.$$
Số trung bình cho biết mức đại diện chung của dữ liệu.

- **Trung vị**: là giá trị đứng giữa khi sắp xếp dữ liệu theo thứ tự tăng dần. Trung vị ít bị ảnh hưởng bởi giá trị quá lớn hoặc quá nhỏ.

- **Khoảng biến thiên**:
$$R=x_{\max}-x_{\min}.$$
Khoảng biến thiên càng lớn thì dữ liệu càng phân tán.

- **Phương sai**:
$$s^2=\frac{(x_1-\overline{x})^2+\cdots+(x_n-\overline{x})^2}{n}.$$

- **Độ lệch chuẩn**:
$$s=\sqrt{s^2}.$$
Độ lệch chuẩn càng lớn thì dữ liệu càng dao động mạnh quanh số trung bình. Khi so sánh rủi ro, ta thường ưu tiên xét độ lệch chuẩn: dữ liệu có $s$ lớn hơn thì kém ổn định hơn.

Trong bối cảnh thực tế, “rủi ro” thường hiểu là mức độ không chắc chắn. Ví dụ, hai khoản đầu tư có lợi nhuận trung bình bằng nhau, khoản nào có độ lệch chuẩn lớn hơn thì rủi ro cao hơn.

## II. Phương pháp làm nhanh

Bước 1: Đọc kỹ đề và xác định dữ liệu đang nói về điều gì: điểm số, doanh thu, lợi nhuận, nhiệt độ, thời gian, sản lượng,... Không vội tính nếu chưa hiểu đơn vị và ý nghĩa.

Bước 2: Xác định câu hỏi cần so sánh đại lượng nào. Nếu hỏi “mức trung bình”, dùng $\overline{x}$ hoặc trung vị. Nếu hỏi “ổn định”, “đều”, “rủi ro”, “biến động”, cần xét khoảng biến thiên, phương sai hoặc độ lệch chuẩn.

Bước 3: Khi so sánh hai nhóm dữ liệu, không chỉ nhìn vào số trung bình. Cần hỏi thêm: nhóm nào dao động nhiều hơn? Có giá trị ngoại lệ không? Mức chênh lệch giữa các giá trị có lớn không?

Bước 4: Nếu dữ liệu ít và đơn giản, có thể so sánh nhanh bằng khoảng biến thiên. Nếu đề cho hoặc yêu cầu tính độ lệch chuẩn, hãy dùng độ lệch chuẩn để kết luận chắc chắn hơn.

Bước 5: Luôn diễn giải kết quả bằng ngôn ngữ thực tế. Ví dụ, thay vì chỉ viết “$s_A>s_B$”, nên kết luận “phương án A có mức biến động lớn hơn nên rủi ro cao hơn phương án B”.

## III. Ví dụ minh họa

Một học sinh theo dõi lợi nhuận theo tháng của hai phương án đầu tư A và B, đơn vị triệu đồng:

A: $8, 10, 12, 14, 16$

B: $6, 9, 12, 15, 18$

Hãy so sánh lợi nhuận trung bình và mức độ rủi ro của hai phương án.

Ta có:
$$\overline{x}_A=\frac{8+10+12+14+16}{5}=12.$$

$$\overline{x}_B=\frac{6+9+12+15+18}{5}=12.$$

Vậy hai phương án có lợi nhuận trung bình bằng nhau.

Xét độ phân tán. Với A, các độ lệch so với trung bình là $-4,-2,0,2,4$, bình phương là $16,4,0,4,16$. Do đó:
$$s_A^2=\frac{16+4+0+4+16}{5}=8,\quad s_A=\sqrt{8}.$$

Với B, các độ lệch là $-6,-3,0,3,6$, bình phương là $36,9,0,9,36$. Do đó:
$$s_B^2=\frac{36+9+0+9+36}{5}=18,\quad s_B=\sqrt{18}.$$

Vì $s_B>s_A$, phương án B biến động mạnh hơn. Kết luận: A và B có lợi nhuận trung bình như nhau, nhưng B rủi ro hơn; A ổn định hơn.

Ý nghĩa thực tế: nếu người đầu tư thích an toàn, phương án A phù hợp hơn. Nếu chấp nhận biến động để kỳ vọng có tháng lợi nhuận cao, có thể cân nhắc B, nhưng phải hiểu rủi ro cũng tăng.

## IV. Chú ý tránh sai

Không nên kết luận phương án tốt hơn chỉ vì có một giá trị lớn nhất cao hơn. Ví dụ B có tháng đạt $18$ triệu, cao hơn A là $16$ triệu, nhưng điều đó không đủ để nói B tốt hơn vì B cũng có tháng thấp hơn nhiều.

Khi dữ liệu có giá trị bất thường, số trung bình có thể bị kéo lệch. Khi đó cần quan sát thêm trung vị hoặc nhận xét về giá trị ngoại lệ.

Độ lệch chuẩn không cho biết dữ liệu cao hay thấp về mặt giá trị trung bình; nó chỉ cho biết mức độ phân tán quanh trung bình. Vì vậy, cần kết hợp cả trung bình và độ lệch chuẩn để đánh giá đầy đủ.

Trong bài thi, các từ khóa như “ổn định”, “đều”, “ít rủi ro”, “biến động nhỏ” thường gợi ý so sánh độ phân tán. Các từ như “hiệu quả trung bình”, “mức trung bình”, “giá trị đại diện” thường gợi ý tính số trung bình hoặc trung vị.

#### Quy tắc chính

- So sánh mức đại diện thì xét số trung bình hoặc trung vị.
- So sánh độ ổn định thì xét khoảng biến thiên hoặc độ lệch chuẩn.
- Độ lệch chuẩn càng lớn thì dữ liệu càng phân tán, rủi ro càng cao.
- Không kết luận chỉ dựa vào giá trị lớn nhất hoặc nhỏ nhất.
- Luôn diễn giải kết quả theo ngữ cảnh thực tế của bài toán.

#### Lỗi thường gặp

- Sai: Thấy giá trị lớn nhất cao hơn nên kết luận phương án tốt hơn -> Đúng: Cần so sánh cả trung bình và độ phân tán.
- Sai: Trung bình bằng nhau thì hai phương án như nhau -> Đúng: Phải xét thêm độ lệch chuẩn để đánh giá rủi ro.
- Sai: Độ lệch chuẩn lớn nghĩa là kết quả trung bình cao -> Đúng: Độ lệch chuẩn chỉ phản ánh mức độ biến động.
- Sai: Bỏ qua đơn vị và ý nghĩa thực tế của dữ liệu -> Đúng: Luôn ghi kết luận theo đúng bối cảnh như điểm số, lợi nhuận, doanh thu.

---

## Chương 8: Xác suất có điều kiện

- Môn: `toan_dai`
- Số bài: 6

### 42. Biến cố độc lập và quy tắc nhân xác suất

- ID: `607e8459-f4bd-5589-83bb-8c157f7500a2`
- Chủ đề: Xác suất có điều kiện
- Mức độ: `nhan_biet`
- Số bài tập: 10

## I. Công thức & định nghĩa cốt lõi

Trong xác suất, **biến cố** là một sự kiện có thể xảy ra hoặc không xảy ra sau một phép thử ngẫu nhiên. Ví dụ: gieo một con xúc xắc, biến cố $A$: “xuất hiện mặt chẵn”.

Hai biến cố $A$ và $B$ được gọi là **độc lập** nếu việc xảy ra hay không xảy ra của biến cố này **không làm thay đổi xác suất xảy ra** của biến cố kia.

Về công thức, $A$ và $B$ độc lập khi:

$$P(A \cap B)=P(A)P(B).$$

Ở đây, $A \cap B$ là biến cố “cả $A$ và $B$ cùng xảy ra”. Công thức trên cũng chính là **quy tắc nhân xác suất cơ bản** cho hai biến cố độc lập.

Nếu có nhiều biến cố độc lập $A_1,A_2,\ldots,A_n$, ta có:

$$P(A_1 \cap A_2 \cap \cdots \cap A_n)=P(A_1)P(A_2)\cdots P(A_n).$$

Ví dụ đơn giản: tung một đồng xu và gieo một con xúc xắc. Biến cố $A$: “đồng xu xuất hiện mặt ngửa”, biến cố $B$: “xúc xắc xuất hiện số 6”. Kết quả của đồng xu không ảnh hưởng đến kết quả của xúc xắc, nên $A$ và $B$ độc lập. Khi đó:

$$P(A \cap B)=P(A)P(B)=\frac12\cdot \frac16=\frac1{12}.$$

## II. Phương pháp làm nhanh

Khi gặp bài toán nhận biết biến cố độc lập và áp dụng quy tắc nhân, ta làm theo các bước sau:

**Bước 1:** Xác định rõ từng biến cố. Đọc đề cẩn thận để biết biến cố nào được hỏi, ví dụ “lấy được bi đỏ”, “gieo được số chẵn”, “cả hai lần đều thành công”.

**Bước 2:** Kiểm tra tính độc lập. Hỏi nhanh: “Kết quả của biến cố trước có làm thay đổi xác suất của biến cố sau không?” Nếu không thay đổi thì thường là độc lập.

Các tình huống thường độc lập: tung đồng xu nhiều lần, gieo xúc xắc nhiều lần, chọn ngẫu nhiên có hoàn lại, các phép thử tách biệt nhau.

Các tình huống thường không độc lập: rút thẻ không hoàn lại, lấy bi liên tiếp không trả lại, chọn học sinh từ một nhóm rồi không đưa lại vào nhóm.

**Bước 3:** Nếu độc lập, dùng công thức nhân:

$$P(A \cap B)=P(A)P(B).$$

Nếu đề hỏi “$A$ xảy ra rồi $B$ xảy ra” trong bối cảnh độc lập, vẫn nhân xác suất từng biến cố.

**Bước 4:** Rút gọn kết quả và kiểm tra xác suất phải nằm trong đoạn $[0,1]$.

## III. Ví dụ minh họa

**Ví dụ 1.** Tung một đồng xu cân đối hai lần. Tính xác suất cả hai lần đều xuất hiện mặt ngửa.

Gọi $A$: “lần 1 xuất hiện mặt ngửa”, $B$: “lần 2 xuất hiện mặt ngửa”. Hai lần tung đồng xu là hai phép thử độc lập nên:

$$P(A)=\frac12,\quad P(B)=\frac12.$$

Do đó:

$$P(A \cap B)=P(A)P(B)=\frac12\cdot\frac12=\frac14.$$

Vậy xác suất cần tìm là $\frac14$.

**Ví dụ 2.** Gieo một con xúc xắc cân đối hai lần. Tính xác suất lần thứ nhất ra số chẵn và lần thứ hai ra số lớn hơn 4.

Gọi $A$: “lần 1 ra số chẵn”. Khi đó $A=\{2,4,6\}$ nên $P(A)=\frac36=\frac12$.

Gọi $B$: “lần 2 ra số lớn hơn 4”. Khi đó $B=\{5,6\}$ nên $P(B)=\frac26=\frac13$.

Hai lần gieo xúc xắc độc lập, do đó:

$$P(A \cap B)=P(A)P(B)=\frac12\cdot\frac13=\frac16.$$

**Ví dụ 3.** Một hộp có 3 bi đỏ và 2 bi xanh. Lấy một viên bi, ghi màu rồi bỏ lại hộp, sau đó lấy tiếp một viên. Tính xác suất cả hai lần đều lấy được bi đỏ.

Vì sau lần lấy thứ nhất có bỏ lại bi vào hộp nên thành phần hộp không đổi. Hai lần lấy là độc lập. Xác suất lấy bi đỏ mỗi lần là:

$$P=\frac35.$$

Vậy xác suất cả hai lần đều đỏ là:

$$\frac35\cdot\frac35=\frac9{25}.$$

## IV. Chú ý tránh sai

Không phải cứ có hai biến cố là độc lập. Muốn kết luận độc lập, cần xem biến cố này có ảnh hưởng đến xác suất của biến cố kia không.

Cần phân biệt “và” với “hoặc”. Nếu đề hỏi “$A$ và $B$ cùng xảy ra” thì thường dùng giao $A \cap B$ và có thể dùng quy tắc nhân nếu độc lập. Nếu đề hỏi “$A$ hoặc $B$ xảy ra” thì liên quan đến hợp $A \cup B$, không dùng trực tiếp công thức nhân.

Trong bài rút bi, rút thẻ, chọn người, cụm từ “có hoàn lại” hoặc “không hoàn lại” rất quan trọng. Có hoàn lại thường giúp các lần thử độc lập; không hoàn lại thường làm xác suất thay đổi.

Cuối cùng, khi áp dụng quy tắc nhân, không được nhân số trường hợp thuận lợi một cách máy móc nếu chưa xác định đúng xác suất từng biến cố và tính độc lập.

#### Quy tắc chính

- Hai biến cố độc lập khi $P(A \cap B)=P(A)P(B)$.
- Nếu kết quả biến cố này không ảnh hưởng xác suất biến cố kia, có thể xem là độc lập.
- Với các biến cố độc lập cùng xảy ra, nhân các xác suất riêng.
- Các phép thử có hoàn lại hoặc lặp lại trong điều kiện như nhau thường độc lập.
- Luôn phân biệt yêu cầu “và” với “hoặc” trước khi chọn công thức.

#### Lỗi thường gặp

- Sai: Thấy hai biến cố bất kỳ liền kết luận độc lập -> Đúng: Phải kiểm tra biến cố này có làm thay đổi xác suất biến cố kia không.
- Sai: Dùng $P(A \cap B)=P(A)P(B)$ cho rút bi không hoàn lại -> Đúng: Không hoàn lại thường không độc lập, cần tính xác suất có điều kiện.
- Sai: Gặp chữ “hoặc” vẫn nhân xác suất -> Đúng: “Hoặc” liên quan đến $A \cup B$, không dùng trực tiếp quy tắc nhân.
- Sai: Quên rút gọn hoặc để xác suất lớn hơn 1 -> Đúng: Kết quả xác suất luôn thuộc đoạn $[0,1]$.

---

### 43. Xác suất có điều kiện

- ID: `c63838f2-babb-5b30-89c5-a02fc3e28c56`
- Chủ đề: Xác suất có điều kiện
- Mức độ: `nhan_biet`
- Số bài tập: 10

## I. Công thức & định nghĩa cốt lõi

Trong xác suất, **xác suất có điều kiện** dùng để tính khả năng xảy ra của biến cố $A$ khi ta đã biết biến cố $B$ xảy ra. Kí hiệu là $P(A|B)$, đọc là “xác suất của $A$ với điều kiện $B$”.

Công thức cơ bản:

$$P(A|B)=\frac{P(A\cap B)}{P(B)},\quad P(B)>0.$$

Trong đó:

- $A\cap B$ là biến cố “cả $A$ và $B$ cùng xảy ra”.
- $P(B)$ là xác suất của điều kiện đã biết.
- Điều kiện bắt buộc: $P(B)>0$, vì không thể chia cho $0$.

Hiểu đơn giản: khi biết $B$ đã xảy ra, ta chỉ xét trong “không gian mới” là $B$. Khi đó, $P(A|B)$ là tỉ lệ phần của $A$ nằm trong $B$ so với toàn bộ $B$.

Nếu các kết quả đồng khả năng, ta có thể dùng công thức đếm:

$$P(A|B)=\frac{n(A\cap B)}{n(B)},\quad n(B)>0.$$

Nghĩa là: trong số các trường hợp thỏa mãn $B$, có bao nhiêu trường hợp đồng thời thỏa mãn $A$.

## II. Phương pháp làm nhanh

Bước 1: Xác định rõ biến cố cần tính và điều kiện đã biết. Nếu đề hỏi “xác suất để $A$ xảy ra biết rằng $B$ đã xảy ra”, ta cần tính $P(A|B)$.

Bước 2: Xác định mẫu số. Mẫu số luôn là xác suất hoặc số trường hợp của **điều kiện** $B$, tức $P(B)$ hoặc $n(B)$.

Bước 3: Xác định tử số. Tử số là phần vừa thỏa mãn $A$, vừa thỏa mãn $B$, tức $P(A\cap B)$ hoặc $n(A\cap B)$.

Bước 4: Thay vào công thức:

$$P(A|B)=\frac{P(A\cap B)}{P(B)}$$

hoặc, nếu đếm trường hợp đồng khả năng:

$$P(A|B)=\frac{n(A\cap B)}{n(B)}.$$

Mẹo nhớ nhanh: **“Biết $B$ thì chia cho $B$”**. Tức là khi tính $P(A|B)$, mẫu số luôn liên quan đến $B$, không phải toàn bộ không gian mẫu ban đầu.

## III. Ví dụ minh họa

Ví dụ 1: Một hộp có 5 bi đỏ và 3 bi xanh. Lấy ngẫu nhiên 1 viên bi. Gọi $A$ là biến cố “lấy được bi đỏ”, $B$ là biến cố “lấy được bi không xanh”. Tính $P(A|B)$.

Vì trong hộp chỉ có bi đỏ và bi xanh nên “không xanh” chính là “đỏ”. Do đó $B=A$.

Ta có:

$$P(A|B)=\frac{P(A\cap B)}{P(B)}=\frac{P(A)}{P(A)}=1.$$

Vậy nếu đã biết viên bi lấy ra không xanh, chắc chắn nó là bi đỏ.

Ví dụ 2: Gieo một con xúc xắc cân đối một lần. Gọi $A$ là biến cố “xuất hiện số chẵn”, $B$ là biến cố “xuất hiện số lớn hơn 3”. Tính $P(A|B)$.

Không gian mẫu là $\Omega=\{1,2,3,4,5,6\}$.

Ta có:

- $A=\{2,4,6\}$.
- $B=\{4,5,6\}$.
- $A\cap B=\{4,6\}$.

Vì đã biết kết quả thuộc $B$, ta chỉ xét các số $4,5,6$. Trong đó có 2 số chẵn là $4,6$.

Do đó:

$$P(A|B)=\frac{n(A\cap B)}{n(B)}=\frac{2}{3}.$$

Ví dụ 3: Trong một lớp có 20 học sinh, có 12 học sinh nữ. Trong số học sinh nữ có 5 bạn đạt học lực giỏi. Chọn ngẫu nhiên 1 học sinh. Biết học sinh được chọn là nữ, tính xác suất học sinh đó đạt học lực giỏi.

Gọi $A$ là biến cố “học sinh đạt học lực giỏi”, $B$ là biến cố “học sinh là nữ”. Cần tính $P(A|B)$.

Trong nhóm nữ có 12 bạn, trong đó 5 bạn giỏi. Vậy:

$$P(A|B)=\frac{n(A\cap B)}{n(B)}=\frac{5}{12}.$$

## IV. Chú ý tránh sai

Không được nhầm $P(A|B)$ với $P(B|A)$. Hai xác suất này thường khác nhau vì điều kiện xét khác nhau.

Khi dùng công thức đếm, mẫu số không phải là toàn bộ số phần tử của không gian mẫu $\Omega$, mà là số phần tử của biến cố điều kiện $B$.

Chỉ được tính $P(A|B)$ khi $P(B)>0$. Nếu $P(B)=0$, biểu thức $P(A|B)$ không xác định.

Nếu đề có cụm “biết rằng”, “với điều kiện”, “trong số các trường hợp”, thường đó là dấu hiệu cần dùng xác suất có điều kiện.

#### Quy tắc chính

- Công thức chính: $P(A|B)=\frac{P(A\cap B)}{P(B)}$, với $P(B)>0$.
- Khi biết $B$ xảy ra, chỉ xét các trường hợp thuộc $B$.
- Nếu các kết quả đồng khả năng, dùng $P(A|B)=\frac{n(A\cap B)}{n(B)}$.
- Mẫu số luôn là điều kiện đã biết, tức $B$.
- Không tự ý đổi $P(A|B)$ thành $P(B|A)$.

#### Lỗi thường gặp

- Sai: Lấy mẫu số là toàn bộ không gian mẫu -> Đúng: Mẫu số phải là $P(B)$ hoặc $n(B)$.
- Sai: Nhầm $P(A|B)$ với $P(B|A)$ -> Đúng: Xác định rõ biến cố nào là điều kiện đã biết.
- Sai: Quên kiểm tra $P(B)>0$ -> Đúng: Chỉ tính xác suất có điều kiện khi điều kiện có xác suất dương.
- Sai: Tử số chỉ lấy $P(A)$ -> Đúng: Tử số phải là $P(A\cap B)$, tức cả $A$ và $B$ cùng xảy ra.

---

### 44. Quy tắc nhân xác suất mở rộng

- ID: `0dc6871d-fe50-57d6-a035-fa26234b6a32`
- Chủ đề: Xác suất có điều kiện
- Mức độ: `thong_hieu`
- Số bài tập: 10

## I. Công thức & định nghĩa cốt lõi

Trong xác suất, quy tắc nhân dùng để tính xác suất xảy ra đồng thời nhiều biến cố theo một thứ tự nhất định. Với hai biến cố $A, B$ và $P(A)>0$, ta có:

$$P(A\cap B)=P(A)\cdot P(B|A).$$

Ở đây, $P(B|A)$ là xác suất của biến cố $B$ khi biết $A$ đã xảy ra. Công thức này đặc biệt quan trọng khi các biến cố có sự phụ thuộc nhau, tức là việc xảy ra biến cố trước làm thay đổi xác suất của biến cố sau.

Với ba biến cố $A, B, C$, nếu các xác suất có điều kiện tương ứng xác định, ta có:

$$P(A\cap B\cap C)=P(A)\cdot P(B|A)\cdot P(C|A\cap B).$$

Tổng quát, với các biến cố $A_1,A_2,\ldots,A_n$, công thức nhân xác suất mở rộng là:

$$P(A_1\cap A_2\cap \cdots \cap A_n)=P(A_1)P(A_2|A_1)P(A_3|A_1\cap A_2)\cdots P(A_n|A_1\cap\cdots\cap A_{n-1}).$$

Nếu các biến cố độc lập, công thức rút gọn thành:

$$P(A_1\cap A_2\cap\cdots\cap A_n)=P(A_1)P(A_2)\cdots P(A_n).$$

Điểm cần hiểu là: công thức nhân mở rộng không yêu cầu các biến cố độc lập. Nó luôn xét xác suất của biến cố sau trong điều kiện tất cả biến cố trước đó đã xảy ra.

## II. Phương pháp làm nhanh

Bước 1: Xác định rõ biến cố cần tính. Nếu đề hỏi “xảy ra đồng thời”, “liên tiếp”, “theo thứ tự”, thường dùng quy tắc nhân.

Bước 2: Chọn thứ tự xét biến cố. Nên chọn thứ tự tự nhiên theo quá trình đề bài mô tả, ví dụ rút lần 1, rút lần 2, rút lần 3.

Bước 3: Viết xác suất từng bước. Sau mỗi bước, cần cập nhật số phần tử còn lại, số trường hợp thuận lợi còn lại hoặc điều kiện mới.

Bước 4: Nhân các xác suất điều kiện. Không cộng các xác suất nếu bài toán yêu cầu các biến cố cùng xảy ra.

Bước 5: Nếu có nhiều trường hợp rời nhau, tính xác suất từng trường hợp bằng quy tắc nhân rồi cộng lại.

Một mẹo quan trọng: hãy đọc đề để nhận ra có “hoàn lại” hay “không hoàn lại”. Nếu có hoàn lại, xác suất các lần thường không đổi. Nếu không hoàn lại, xác suất lần sau thường phụ thuộc vào kết quả lần trước.

## III. Ví dụ minh họa

Ví dụ 1. Một hộp có 5 bi đỏ và 3 bi xanh. Lấy ngẫu nhiên liên tiếp 2 viên bi không hoàn lại. Tính xác suất lấy được viên thứ nhất đỏ và viên thứ hai xanh.

Gọi $A$ là biến cố “lần 1 lấy bi đỏ”, $B$ là biến cố “lần 2 lấy bi xanh”. Khi đó:

$$P(A)=\frac{5}{8}.$$

Sau khi đã lấy được 1 bi đỏ, hộp còn 7 viên, trong đó vẫn có 3 bi xanh. Do đó:

$$P(B|A)=\frac{3}{7}.$$

Vậy:

$$P(A\cap B)=P(A)P(B|A)=\frac{5}{8}\cdot\frac{3}{7}=\frac{15}{56}.$$

Ví dụ 2. Gieo một con xúc xắc cân đối 3 lần. Tính xác suất cả 3 lần đều ra số chẵn.

Mỗi lần gieo có xác suất ra số chẵn là $\frac{3}{6}=\frac{1}{2}$. Các lần gieo độc lập nên:

$$P=\frac{1}{2}\cdot\frac{1}{2}\cdot\frac{1}{2}=\frac{1}{8}.$$

Ở ví dụ này, vì các lần gieo không ảnh hưởng nhau nên ta dùng dạng rút gọn của quy tắc nhân.

Ví dụ 3. Một lớp có 20 học sinh, gồm 12 nữ và 8 nam. Chọn ngẫu nhiên 3 học sinh không hoàn lại. Tính xác suất chọn được cả 3 học sinh đều là nữ.

Xét lần lượt ba lần chọn. Xác suất lần 1 chọn nữ là $\frac{12}{20}$. Nếu lần 1 đã chọn nữ, còn 11 nữ trong 19 học sinh, nên xác suất lần 2 chọn nữ là $\frac{11}{19}$. Nếu hai lần đầu đều chọn nữ, còn 10 nữ trong 18 học sinh, nên xác suất lần 3 chọn nữ là $\frac{10}{18}$.

Vậy:

$$P=\frac{12}{20}\cdot\frac{11}{19}\cdot\frac{10}{18}=\frac{11}{57}.$$

## IV. Chú ý tránh sai

Không phải cứ thấy nhiều biến cố là được nhân trực tiếp các xác suất ban đầu. Nếu các biến cố phụ thuộc nhau, phải dùng xác suất có điều kiện. Chẳng hạn, rút bi không hoàn lại thì số bi trong hộp thay đổi sau mỗi lần rút.

Cần phân biệt “và” với “hoặc”. Từ “và”, “đồng thời”, “liên tiếp đều” thường gợi ý phép nhân. Từ “hoặc”, “ít nhất một trường hợp”, “một trong các khả năng” thường phải xét các trường hợp rồi cộng xác suất nếu chúng rời nhau.

Khi bài toán có thứ tự, ví dụ “lần 1 đỏ, lần 2 xanh”, ta tính đúng theo thứ tự đó. Nếu đề chỉ nói “một đỏ, một xanh” khi lấy 2 lần, cần xét cả hai thứ tự: đỏ rồi xanh, hoặc xanh rồi đỏ.

Cuối cùng, chỉ được dùng công thức độc lập $P(A\cap B)=P(A)P(B)$ khi chắc chắn $A$ và $B$ độc lập. Nếu chưa biết độc lập, cách an toàn là dùng $P(A\cap B)=P(A)P(B|A)$.

#### Quy tắc chính

- Biến cố cùng xảy ra theo thứ tự thì dùng quy tắc nhân.
- Biến cố sau phải xét trong điều kiện các biến cố trước đã xảy ra.
- Không hoàn lại thì xác suất thường thay đổi sau mỗi lần chọn.
- Chỉ nhân xác suất riêng lẻ khi các biến cố độc lập.
- Nhiều trường hợp rời nhau thì nhân trong từng trường hợp rồi cộng.

#### Lỗi thường gặp

- Sai: Dùng $P(A)P(B)$ khi $A, B$ phụ thuộc -> Đúng: Dùng $P(A)P(B|A)$.
- Sai: Không cập nhật mẫu số sau mỗi lần rút không hoàn lại -> Đúng: Giảm tổng số phần tử sau mỗi lần chọn.
- Sai: Nhầm bài toán “và” thành phép cộng -> Đúng: Các biến cố cùng xảy ra thì thường dùng phép nhân.
- Sai: Bỏ sót thứ tự khác khi đề không yêu cầu thứ tự cụ thể -> Đúng: Liệt kê đủ các trường hợp rời nhau rồi cộng.

---

### 45. Công thức xác suất toàn phần

- ID: `ef4f7a14-703b-5dab-8260-24f5a4297e4f`
- Chủ đề: Xác suất có điều kiện
- Mức độ: `thong_hieu`
- Số bài tập: 10

## I. Công thức & định nghĩa cốt lõi

Định lý xác suất toàn phần dùng để tính xác suất của một biến cố $A$ khi $A$ có thể xảy ra qua nhiều “trường hợp” khác nhau. Các trường hợp này thường được mô tả bởi các biến cố $B_1, B_2, \ldots, B_n$.

Nếu $B_1, B_2, \ldots, B_n$ là một hệ đầy đủ các biến cố, nghĩa là:

- $B_i \cap B_j = \varnothing$ với $i \ne j$;
- $B_1 \cup B_2 \cup \cdots \cup B_n = \Omega$;
- $P(B_i)>0$ với mọi $i$,

thì với biến cố $A$ bất kỳ, ta có:

$$P(A)=P(B_1)P(A|B_1)+P(B_2)P(A|B_2)+\cdots+P(B_n)P(A|B_n).$$

Viết gọn:

$$P(A)=\sum_{i=1}^{n} P(B_i)P(A|B_i).$$

Ý nghĩa dễ hiểu: muốn tính xác suất $A$, ta chia không gian mẫu thành các trường hợp $B_i$, rồi cộng xác suất “đi qua từng trường hợp” để xảy ra $A$.

Trong đó $P(A|B_i)$ là xác suất có điều kiện: xác suất xảy ra $A$ khi biết rằng $B_i$ đã xảy ra.

## II. Phương pháp làm nhanh

Bước 1: Xác định biến cố cần tính, thường đặt là $A$.

Bước 2: Tìm cách chia bài toán thành các trường hợp loại trừ nhau và bao phủ hết khả năng. Các trường hợp này là $B_1, B_2, \ldots, B_n$.

Bước 3: Tính xác suất từng trường hợp $P(B_i)$.

Bước 4: Trong mỗi trường hợp, tính xác suất để $A$ xảy ra, tức $P(A|B_i)$.

Bước 5: Thay vào công thức:

$$P(A)=\sum P(B_i)P(A|B_i).$$

Mẹo nhận diện nhanh: Khi đề bài có các cụm như “chọn một hộp rồi lấy bi”, “chọn một máy rồi kiểm tra sản phẩm”, “một học sinh thuộc nhóm này hoặc nhóm kia”, “xác suất phụ thuộc vào nguồn gốc ban đầu”, thì thường dùng xác suất toàn phần.

## III. Ví dụ minh họa

Ví dụ: Có hai hộp bi. Hộp 1 có 3 bi đỏ, 2 bi xanh. Hộp 2 có 1 bi đỏ, 4 bi xanh. Chọn ngẫu nhiên một hộp, sau đó lấy ngẫu nhiên một viên bi từ hộp đã chọn. Tính xác suất lấy được bi đỏ.

Gọi $A$ là biến cố “lấy được bi đỏ”.

Gọi $B_1$ là biến cố “chọn hộp 1”, $B_2$ là biến cố “chọn hộp 2”. Vì chọn ngẫu nhiên một trong hai hộp nên:

$$P(B_1)=P(B_2)=\frac{1}{2}.$$

Nếu đã chọn hộp 1, xác suất lấy được bi đỏ là:

$$P(A|B_1)=\frac{3}{5}.$$

Nếu đã chọn hộp 2, xác suất lấy được bi đỏ là:

$$P(A|B_2)=\frac{1}{5}.$$

Theo công thức xác suất toàn phần:

$$P(A)=P(B_1)P(A|B_1)+P(B_2)P(A|B_2).$$

Thay số:

$$P(A)=\frac{1}{2}\cdot\frac{3}{5}+\frac{1}{2}\cdot\frac{1}{5}=\frac{3}{10}+\frac{1}{10}=\frac{2}{5}.$$

Vậy xác suất lấy được bi đỏ là $\frac{2}{5}$.

Nhận xét: Ta không thể cộng trực tiếp số bi đỏ của hai hộp rồi chia tổng số bi, vì trước đó có bước chọn hộp. Xác suất lấy bi đỏ phụ thuộc vào việc hộp nào được chọn.

## IV. Chú ý tránh sai

Điều quan trọng nhất là các biến cố $B_i$ phải tạo thành một hệ đầy đủ. Nếu thiếu trường hợp hoặc các trường hợp bị chồng lặp, công thức sẽ cho kết quả sai.

Không được nhầm giữa $P(A|B_i)$ và $P(B_i|A)$. Đây là hai xác suất khác nhau. Trong xác suất toàn phần, ta cần xác suất xảy ra $A$ khi biết từng trường hợp $B_i$.

Ngoài ra, cần nhân trước khi cộng. Mỗi nhánh có xác suất là $P(B_i)P(A|B_i)$, không phải chỉ cộng các xác suất điều kiện.

Khi làm bài, nên vẽ sơ đồ cây. Tầng thứ nhất là các trường hợp $B_i$, tầng thứ hai là biến cố $A$ trong từng trường hợp. Xác suất theo một nhánh bằng tích các xác suất trên nhánh đó; xác suất cuối cùng bằng tổng các nhánh dẫn đến $A$.

#### Quy tắc chính

- Chia bài toán thành các trường hợp đầy đủ và rời nhau.
- Mỗi nhánh xác suất bằng $P(B_i)P(A|B_i)$.
- Cộng tất cả các nhánh dẫn đến biến cố cần tính.
- Phân biệt rõ $P(A|B_i)$ với $P(B_i|A)$.
- Sơ đồ cây giúp tránh thiếu hoặc trùng trường hợp.

#### Lỗi thường gặp

- Sai: Cộng trực tiếp các xác suất điều kiện $P(A|B_i)$ -> Đúng: Phải nhân với $P(B_i)$ rồi mới cộng.
- Sai: Chọn các trường hợp $B_i$ bị chồng lặp -> Đúng: Các $B_i$ phải đôi một xung khắc.
- Sai: Bỏ sót một trường hợp có thể xảy ra -> Đúng: Tổng các $B_i$ phải bao phủ toàn bộ không gian mẫu.
- Sai: Nhầm $P(A|B_i)$ thành $P(B_i|A)$ -> Đúng: Xác suất toàn phần dùng $P(A|B_i)$.

---

### 46. Công thức Bayes và ứng dụng

- ID: `1627966a-2994-5223-b220-4195da336e0c`
- Chủ đề: Xác suất có điều kiện
- Mức độ: `thong_hieu`
- Số bài tập: 10

## I. Công thức Bayes cốt lõi

Công thức Bayes dùng để tính xác suất của một nguyên nhân khi đã quan sát được kết quả. Nếu các biến cố $A_1,A_2,\ldots,A_n$ tạo thành một hệ đầy đủ và $P(B)>0$, thì:

$$P(A_i|B)=\frac{P(A_i)P(B|A_i)}{\sum_{k=1}^{n}P(A_k)P(B|A_k)}$$

Trong đó $P(A_i)$ là xác suất ban đầu của nguyên nhân $A_i$, còn $P(B|A_i)$ là xác suất quan sát được kết quả $B$ nếu nguyên nhân $A_i$ xảy ra.

## II. Cách làm nhanh

Bước 1: Xác định các nguyên nhân có thể xảy ra $A_i$. Bước 2: Ghi xác suất ban đầu $P(A_i)$. Bước 3: Ghi xác suất điều kiện $P(B|A_i)$. Bước 4: Tính từng tích $P(A_i)P(B|A_i)$. Bước 5: Lấy tích cần tìm chia cho tổng các tích.

## III. Ví dụ minh họa

Một hộp I được chọn với xác suất $0.4$, hộp II với xác suất $0.6$. Xác suất lấy được bi đỏ nếu chọn hộp I là $0.7$, nếu chọn hộp II là $0.2$. Biết đã lấy được bi đỏ, xác suất đã chọn hộp I là:

$$P(I|D)=\frac{0.4\cdot0.7}{0.4\cdot0.7+0.6\cdot0.2}=\frac{0.28}{0.40}=0.7$$

## IV. Chú ý tránh sai

Không được nhầm $P(A|B)$ với $P(B|A)$. Khi dùng Bayes, mẫu số phải là xác suất toàn phần của kết quả đã quan sát.

#### Quy tắc chính

- Bayes dùng để suy luận ngược từ kết quả về nguyên nhân.
- Mẫu số là tổng các tích $P(A_k)P(B|A_k)$.
- Luôn kiểm tra các nguyên nhân $A_i$ có tạo thành hệ đầy đủ hay không.

#### Lỗi thường gặp

- Sai: Nhầm $P(A|B)$ với $P(B|A)$ -> Đúng: Xác định rõ biến cố đã biết.
- Sai: Quên cộng đủ các trường hợp ở mẫu số -> Đúng: Dùng xác suất toàn phần.
- Sai: Chỉ dùng $P(B|A_i)$ -> Đúng: Nhân thêm xác suất ban đầu $P(A_i)$.

---

### 47. Tính xác suất bằng sơ đồ cây

- ID: `0ac61c0a-912c-51d5-934b-fdf201a06a18`
- Chủ đề: Xác suất có điều kiện
- Mức độ: `thong_hieu`
- Số bài tập: 10

## I. Công thức & định nghĩa cốt lõi

Sơ đồ cây là công cụ biểu diễn một phép thử gồm nhiều giai đoạn liên tiếp. Mỗi giai đoạn được vẽ thành các nhánh, trên mỗi nhánh ghi xác suất xảy ra biến cố tương ứng ở giai đoạn đó.

Nếu một kết quả cuối cùng đi qua các nhánh có xác suất lần lượt là $p_1, p_2, \ldots, p_n$ thì xác suất của đường đi đó là:

$$P = p_1p_2\cdots p_n.$$

Đây là quy tắc nhân xác suất. Ta dùng khi các bước xảy ra liên tiếp theo kiểu “và”: vừa xảy ra biến cố ở bước 1, vừa xảy ra biến cố ở bước 2, ...

Nếu một biến cố cần tính có thể xảy ra theo nhiều đường đi khác nhau và các đường đi đó rời nhau, ta cộng xác suất các đường đi:

$$P(A)=P(\text{đường 1})+P(\text{đường 2})+\cdots.$$

Đây là quy tắc cộng xác suất. Trên sơ đồ cây, câu hỏi thường là: “đi đến những lá nào thỏa mãn yêu cầu?” Sau đó nhân trên từng đường và cộng các đường phù hợp.

Cần chú ý xác suất ở nhánh sau có thể thay đổi tùy nhánh trước, nhất là bài toán “lấy không hoàn lại”. Khi đó mẫu số và tử số phải được cập nhật theo kết quả đã xảy ra.

## II. Phương pháp làm nhanh

Bước 1: Xác định số giai đoạn. Mỗi lần rút, gieo, chọn, kiểm tra, bốc thăm thường là một giai đoạn.

Bước 2: Vẽ nhánh theo các khả năng quan trọng. Không nhất thiết liệt kê mọi kết quả chi tiết nếu bài chỉ hỏi theo nhóm. Ví dụ, thay vì ghi từng viên bi, ta chỉ cần chia thành “đỏ” và “không đỏ”, hoặc “đạt” và “không đạt”.

Bước 3: Ghi xác suất trực tiếp lên từng nhánh. Với bài có hoàn lại, xác suất ở các lần thường không đổi. Với bài không hoàn lại, sau mỗi nhánh phải cập nhật số lượng còn lại.

Bước 4: Khoanh các đường đi thỏa mãn yêu cầu. Trên mỗi đường, nhân các xác suất nhánh. Cuối cùng cộng các kết quả vừa nhân.

Bước 5: Có thể dùng biến cố đối nếu thuận tiện. Ví dụ, “ít nhất một lần thành công” thường tính nhanh bằng:

$$P(\text{ít nhất một})=1-P(\text{không lần nào}).$$

## III. Ví dụ minh họa

Một hộp có 4 bi đỏ và 3 bi xanh. Lấy ngẫu nhiên 2 viên bi liên tiếp, không hoàn lại. Tính xác suất lấy được đúng 1 viên đỏ.

Ta có 2 giai đoạn: lần 1 và lần 2. Chia mỗi lần thành hai khả năng: Đỏ $(Đ)$ hoặc Xanh $(X)$.

Lần 1:

- Nhánh $Đ$: xác suất $\dfrac{4}{7}$.
- Nhánh $X$: xác suất $\dfrac{3}{7}$.

Nếu lần 1 là $Đ$, trong hộp còn 3 đỏ, 3 xanh, tổng 6 viên. Khi đó:

- Nhánh tiếp theo $X$: xác suất $\dfrac{3}{6}$.

Đường đi $ĐX$ có xác suất:

$$P(ĐX)=\frac{4}{7}\cdot\frac{3}{6}=\frac{2}{7}.$$

Nếu lần 1 là $X$, trong hộp còn 4 đỏ, 2 xanh, tổng 6 viên. Khi đó:

- Nhánh tiếp theo $Đ$: xác suất $\dfrac{4}{6}$.

Đường đi $XĐ$ có xác suất:

$$P(XĐ)=\frac{3}{7}\cdot\frac{4}{6}=\frac{2}{7}.$$

Biến cố “đúng 1 viên đỏ” xảy ra theo hai đường rời nhau: $ĐX$ hoặc $XĐ$. Do đó:

$$P= P(ĐX)+P(XĐ)=\frac{2}{7}+\frac{2}{7}=\frac{4}{7}.$$

Nhận xét: Nếu học sinh chỉ tính $\dfrac{4}{7}\cdot\dfrac{3}{6}$ thì mới tính một thứ tự là “đỏ rồi xanh”, chưa tính trường hợp “xanh rồi đỏ”. Sơ đồ cây giúp nhìn rõ cần cộng cả hai đường.

## IV. Chú ý tránh sai

Thứ nhất, phải phân biệt “có hoàn lại” và “không hoàn lại”. Có hoàn lại thì số lượng ban đầu giữ nguyên sau mỗi lần. Không hoàn lại thì tổng số đối tượng giảm, và số lượng từng loại cũng thay đổi tùy nhánh.

Thứ hai, không cộng xác suất trên cùng một đường đi. Trên một đường đi liên tiếp, ta nhân. Chỉ cộng các đường đi khác nhau cùng thỏa mãn yêu cầu.

Thứ ba, cần đọc kỹ các cụm như “ít nhất”, “đúng”, “không quá”. “Ít nhất 1” gồm nhiều trường hợp, còn “đúng 1” chỉ gồm các đường có đúng một lần xảy ra biến cố.

Thứ tư, sau khi tính xong nên kiểm tra kết quả có nằm trong đoạn $[0,1]$ không. Nếu xác suất lớn hơn 1 hoặc âm thì chắc chắn sai.

#### Quy tắc chính

- Trên một đường đi thì nhân các xác suất nhánh.
- Nhiều đường đi rời nhau cùng thỏa mãn thì cộng lại.
- Không hoàn lại thì phải cập nhật số lượng sau mỗi nhánh.
- Khoanh đúng các lá thỏa mãn trước khi tính.
- Bài “ít nhất một” thường nên xét biến cố đối.

#### Lỗi thường gặp

- Sai: Cộng xác suất các nhánh trên cùng một đường -> Đúng: Nhân các xác suất liên tiếp trên một đường đi.
- Sai: Quên trường hợp đảo thứ tự, ví dụ chỉ tính đỏ rồi xanh -> Đúng: Cộng cả đỏ rồi xanh và xanh rồi đỏ nếu đều thỏa mãn.
- Sai: Dùng lại mẫu số ban đầu trong bài không hoàn lại -> Đúng: Sau mỗi lần lấy, cập nhật số lượng còn lại.
- Sai: Nhầm “ít nhất 1” với “đúng 1” -> Đúng: Liệt kê rõ các đường đi hoặc dùng biến cố đối.

---
