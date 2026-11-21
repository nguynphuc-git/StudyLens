# Mathfolio · StudyLens

Sổ bài tập toán của StudyLens. Nhập công thức, viết lời giải, đính kèm ảnh và lưu bài trong thư mục riêng của tài khoản trên trình duyệt hiện tại.

## Chạy thử trên máy của đồng đội

1. Cài [Node.js 24 LTS](https://nodejs.org/). Lần chạy đầu cần Internet để tải các gói.
2. Trong GitHub Desktop, clone [StudyLens](https://github.com/nguynphuc-git/StudyLens), rồi chọn **Current branch → feat/digital-exercise-notebook**. Nếu đã clone, chọn nhánh này rồi **Fetch origin → Pull origin**. Cũng có thể tải [ZIP của nhánh Mathfolio](https://github.com/nguynphuc-git/StudyLens/archive/refs/heads/feat/digital-exercise-notebook.zip) và giải nén.
3. Mở **Start-Mathfolio.cmd** trên Windows hoặc **Start-Mathfolio.command** trên macOS. Trên Linux, từ thư mục dự án chạy `npm run local`. Nếu macOS yêu cầu xác nhận cho tệp đã tải về, mở từ Finder theo hướng dẫn của hệ thống. Có thể chạy `npm run local` trên cả ba hệ điều hành.
4. Trình duyệt sẽ mở [Mathfolio trên máy này](http://localhost:5173). Nhập email thử và mật khẩu từ 6 ký tự, chọn **Create account**. Lần sau dùng **Sign in** trong cùng trình duyệt. Mỗi máy có tài khoản emulator riêng.

Trình khởi động cài dependency từ lockfile, khởi động Auth Emulator cho project demo và mở Vite. Sổ bài tập lưu bằng IndexedDB nên chế độ này chỉ cần Auth Emulator. Không cần Java, tài khoản Firebase, file môi trường hay quota để chạy luồng cơ bản. Khi dừng, nhấn **Ctrl+C một lần** và chờ xuất dữ liệu trước khi đóng cửa sổ. Dữ liệu Auth ở `.mathfolio-auth/`. Lần đầu, nếu có bản xuất của cách chạy cũ ở `.emulator-data/` hoặc `../studylens-emulator-data/`, trình khởi động sẽ nhập lại tài khoản. Giữ cùng origin, trình duyệt và UID để đọc lại sổ.

## Thử một bài trong hai phút

- Nhập đề và viết vào **Your working notes**. Chọn **Save exercise**, đặt tên, chọn các thư mục tùy ý rồi chọn **Save on this device**. Mọi bài đã lưu đều có trong **My exercises**; các thư mục cùng tham chiếu một bài. Bạn có thể lưu cả bài đang làm dở.
- Mở **Exercise library → My exercises → Open exercise** để xem bài, sửa ghi chú, thêm/xóa ảnh bài giải, đổi tên ảnh và chọn thêm thư mục. Nhấn **Save changes** để lưu các thay đổi. **Open in workspace** mở bản nháp để tiếp tục làm. Tải lại trang rồi mở thư viện để kiểm tra dữ liệu.
- Thử `2x+3=7` và chọn **Confirm & analyze** để xem thẻ công thức cục bộ. Các bài ngoài phạm vi công thức, hint và chat dùng Firebase AI Logic. Gemini cần project thật, App Check và thiết bị tương thích cho chế độ on-device.
- Chọn **Add content → Read image**: **Read printed text** là nút chính màu xanh, dùng OCR chữ in ngay trên thiết bị. **Read with AI** ở bên phải cho chọn **Local AI / Cloud AI**; Cloud hỏi đồng ý riêng cho ảnh nguồn và có thể bật quyền cho phiên này ngay trong cửa sổ. Bấm ảnh để zoom, sửa chữ/công thức trực tiếp trong **Review your problem**, dùng bàn phím toán hoặc **Restore extracted text** để khôi phục bản nhận diện gần nhất. Kiểm tra công thức trước khi dùng đề.
- Bản đang làm được tự lưu riêng; tải lại trang rồi chọn **Resume draft** để tiếp tục. **Save exercise** mới cập nhật bài gốc trong thư viện.
- **Chat** và **Your working notes** dùng ngay từ đầu, không cần chạy kiến thức hoặc hint. Có thể hỏi trong chat khi chưa nhập đề; Cloud AI vẫn cần sự đồng ý của bạn.
- Trong thư viện, chọn **Mark completed / Mark in progress** ngay trên thẻ bài. Trạng thái được lưu cho cùng bài ở mọi thư mục và đồng bộ với ô đánh dấu trong Workspace; ghi chú đang viết dở được giữ nguyên.
- Đề, ghi chú và chat có nút **Math / Text**; nhấn **Alt một lần** (**Option / ⌥** trên Mac) trong ô đang viết để chuyển nhanh. Space tạo khoảng cách trong Math mà vẫn giữ chế độ Math. Nhận diện tự động khi gõ đã tắt. Một bàn phím nổi dùng chung sẽ nhập vào ô bạn đang chọn, có thể kéo thả và giữ mở khi bấm ra ngoài.
- Có thể dán đoạn chữ kèm công thức trực tiếp trong **Math**, giữ xuống dòng và công thức từ nguồn có chú thích LaTeX (ví dụ KaTeX). **Text** giữ nguyên chữ, chỉ định dạng toán khi có dấu phân cách LaTeX hoặc nguồn có công thức cấu trúc. Sau khi dán, chế độ gõ vẫn theo lựa chọn của bạn; kiểm tra lại công thức nếu nguồn sao chép chỉ có văn bản phẳng.
- Hàng đầu gồm đề (2/3) và **Illustrations** (1/3); hàng tiếp là kiến thức/hint; hàng cuối là chat/notes. Chọn **Use this illustration for AI** ở những ảnh cần cho bài toán.
- Hint 2/3 gợi ý **Use Cloud AI** khi có mạng và hỏi đồng ý trước khi chạy.
- Hint bao quát từng bài/ý; chọn **Reset hints** để tạo lại các tầng cũ. Bàn phím thông dụng có **xₙ**, Calculus & series có **⋃ / ⋂**.
- Chọn màu pastel khi tạo thư mục, hoặc mở **Color** trên ô thư mục để đổi màu. Header có nền riêng và tương thích với Appearance sáng/tối.
- Appearance và Study options tự đóng khi bấm ra ngoài; các lựa chọn có menu riêng với dấu tick. Dark mode áp dụng cho cả đề, ghi chú, chat và bàn phím toán. Trang đăng nhập có ký hiệu toán chuyển động nhẹ, tôn trọng cài đặt giảm chuyển động.
- Nhấn ảnh đề/bài làm trong Workspace hoặc thư viện để xem lớn, zoom và kéo ảnh; nhấn Escape để quay lại.
- **Illustrations** chỉ giữ ảnh minh họa để xem và đưa vào ngữ cảnh AI; không còn nút đọc chữ dưới mỗi ảnh. Để đọc đề từ ảnh, dùng **Add content → Read image**. Trong PDF, chọn trang ở **PDF page**, chọn nhiều câu qua các trang rồi sửa công thức trực tiếp trong từng ô **Extracted question**. Ảnh **Source page** bấm để zoom; phần nguồn và các ô sửa dùng chung thanh cuộn ngoài. **Use N questions** nhập các câu đã chọn thành một đề nhiều bài (tối đa 6.000 ký tự).
- Xem [các tính năng Mathfolio](NOTEBOOK.md) và [checklist sprint chung](https://github.com/nguynphuc-git/StudyLens/issues/2).

## Môi trường Firebase khi được cấp quota

| Nhu cầu | Cấu hình |
| --- | --- |
| Sổ bài tập trên máy | Trình khởi động bật `VITE_USE_EMULATORS=true` cho lần chạy. |
| Thử AI khi vẫn dùng tài khoản emulator | Sao chép `.env.example` thành `.env.local`. Điền cấu hình Web, khóa site reCAPTCHA Enterprise và model được cấp. Bật AI Logic và đăng ký App Check cho web app trong cùng project. Chỉ dùng debug token trong development. |
| Thử Auth của project thật | Bật Email/Password trong Authentication. Dùng cấu hình Web của project, `VITE_USE_EMULATORS=false` và chạy `npm run dev` để dùng các giá trị trong file. |
| Build cho bản online sau sprint hoặc khi được cấp quyền | Cấu hình biến `VITE_FIREBASE_*`, `VITE_RECAPTCHA_SITE_KEY`, `VITE_CLOUD_MODEL` ở môi trường build theo `.env.example`. Đặt `VITE_USE_EMULATORS=false` và `VITE_APPCHECK_DEBUG=false`. Đăng ký domain thật cho Auth và reCAPTCHA. Chạy test và build lại sau mỗi lần đổi cấu hình. Firebase Hosting dùng thư mục `dist/` theo `firebase.json`. |

Các biến `VITE_*` xuất hiện trong trình duyệt. Chỉ điền cấu hình Firebase Web và khóa site công khai. Service account, khóa riêng, Gemini server key và App Check debug token phải nằm ngoài mã nguồn và ngoài `VITE_*`. Xem [cấu hình Web Firebase](https://firebase.google.com/docs/projects/api-keys) và [App Check cho Web](https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider).

Auth Emulator và Firebase thật có bộ tài khoản riêng. Sổ phân vùng theo project và UID trên thiết bị, nên đổi sang project của ban tổ chức sẽ mở một sổ riêng. Khi hết sprint, xác nhận thời điểm thu hồi quota và quyền với ban tổ chức trước khi tiếp tục dùng AI.

## Kiểm tra kỹ thuật

```sh
npm ci
npm test
npm run build
```

Nếu đang dùng thử qua trình khởi động, dừng phiên local trước khi chạy lại `npm ci`. Nếu đã mở phiên khác trên cổng 9099 hoặc 5173, dừng phiên cũ rồi mở lại. Muốn chạy thêm Firestore và Storage để phát triển các module cũ, xem [hướng dẫn Emulator đầy đủ](NOTEBOOK.md#chạy).
